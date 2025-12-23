/**
 * Device Activity Tracker - CLI Interface
 *
 * This is a proof-of-concept tool demonstrating privacy vulnerabilities
 * in messaging apps (in this case WhatsApp) through RTT-based activity analysis.
 *
 * For educational and research purposes only.
 */

import 'dotenv/config';
import '@whiskeysockets/baileys';
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { pino } from 'pino';
import { Boom } from '@hapi/boom';
import * as qrcode from 'qrcode-terminal';
import { WhatsAppTracker } from './tracker';
import * as readline from 'readline';


let currentTargetJid: string | null = null;
let currentTracker: WhatsAppTracker | null = null;

async function connectToWhatsApp() {
    const authDir = process.env.WA_AUTH_DIR || 'auth_info_baileys';
    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        markOnlineOnConnect: true,
    });

    let isConnected = false;

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            isConnected = false;
            // Stop the tracker if it's running, as the socket is dead
            if (currentTracker) {
                currentTracker.stopTracking();
                currentTracker = null;
            }

            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('opened connection');
            isConnected = true;

            if (currentTargetJid) {
                console.log(`Resuming tracking for ${currentTargetJid}...`);
                currentTracker = new WhatsAppTracker(sock, currentTargetJid);
                currentTracker.startTracking();
            } else {
                askForTarget();
            }
        } else {
            console.log('connection update', update);
        }
    });

    sock.ev.on('creds.update', saveCreds);

    const askForTarget = () => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('Enter target phone number (with country code, e.g., 491701234567): ', async (number) => {
            // Basic cleanup
            const cleanNumber = number.replace(/\D/g, '');

            if (cleanNumber.length < 10) {
                console.log('Invalid number format. Please try again.');
                rl.close();
                askForTarget();
                return;
            }

            const targetJid = cleanNumber + '@s.whatsapp.net';

            console.log(`Verifying ${targetJid}...`);
            try {
                const results = await sock.onWhatsApp(targetJid);
                const result = results?.[0];

                if (result?.exists) {
                    console.log(`Target verified: ${result.jid}`);
                    currentTargetJid = result.jid;
                    currentTracker = new WhatsAppTracker(sock, result.jid);
                    currentTracker.startTracking();
                    rl.close();
                } else {
                    console.log('Number not registered on WhatsApp.');
                    rl.close();
                    askForTarget();
                }
            } catch (err) {
                console.error('Error verifying number:', err);
                rl.close();
                askForTarget();
            }
        });
    };
}

connectToWhatsApp();
