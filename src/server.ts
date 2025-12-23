/**
 * Device Activity Tracker - Web Server
 *
 * HTTP server with Socket.IO for real-time tracking visualization.
 * Provides REST API and WebSocket interface for the React frontend.
 *
 * For educational and research purposes only.
 */

import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { pino } from 'pino';
import { Boom } from '@hapi/boom';
import { WhatsAppTracker } from './tracker';
import { connectDB, Metric } from './database';

const app = express();
app.use(cors());

// Connect to Database
connectDB();

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all origins for dev
        methods: ["GET", "POST"]
    }
});

// History API
app.get('/api/history/:jid', async (req, res) => {
    try {
        const { jid } = req.params;
        const { range } = req.query;

        let startTime = new Date();
        if (range === '24h' || !range) {
            startTime.setHours(startTime.getHours() - 24);
        } else {
             // Handle other ranges if needed, defaulting to 24h
            startTime.setHours(startTime.getHours() - 24);
        }

        const metrics = await Metric.find({
            jid,
            timestamp: { $gte: startTime }
        }).sort({ timestamp: 1 });

        res.json(metrics);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Analysis API
app.get('/api/analysis/:jid', async (req, res) => {
    try {
        const { jid } = req.params;
        const startTime = new Date();
        startTime.setHours(startTime.getHours() - 24);

        const metrics = await Metric.find({
            jid,
            timestamp: { $gte: startTime }
        }).sort({ timestamp: 1 });

        if (metrics.length === 0) {
            return res.json({
                totalScreenTime: 0,
                longestSleep: 0,
                avgOnlineRtt: 0,
                avgStandbyRtt: 0
            });
        }

        let totalOnlineTime = 0;
        let currentSleepDuration = 0;
        let longestSleep = 0;
        let onlineRttSum = 0;
        let onlineCount = 0;
        let standbyRttSum = 0;
        let standbyCount = 0;

        for (let i = 0; i < metrics.length; i++) {
            const metric = metrics[i];
            const nextMetric = metrics[i + 1];

            // Average RTT
            if (metric.state === 'Online') {
                onlineRttSum += metric.rtt;
                onlineCount++;
            } else if (metric.state === 'Standby') {
                standbyRttSum += metric.rtt;
                standbyCount++;
            }

            // Time calculations (approximation between points)
            if (nextMetric) {
                const duration = nextMetric.timestamp.getTime() - metric.timestamp.getTime();

                // Cap duration to avoid huge gaps counting as activity (e.g. if tracker was off)
                // Assuming max probe interval is small, but if tracker stops, we shouldn't count it.
                // Let's limit to 1 minute.
                const validDuration = duration < 60000 ? duration : 0;

                if (metric.state === 'Online') {
                    totalOnlineTime += validDuration;
                    currentSleepDuration = 0; // Reset sleep counter
                } else {
                    // Standby or Offline
                    if (validDuration > 0) {
                        currentSleepDuration += validDuration;
                        if (currentSleepDuration > longestSleep) {
                            longestSleep = currentSleepDuration;
                        }
                    } else {
                         // Gap too large, reset sleep sequence?
                         // Or maybe just don't add to it, but keep the sequence if it continues?
                         // If the tracker was off, we don't know if they were sleeping.
                         // Let's reset for safety.
                         currentSleepDuration = 0;
                    }
                }
            }
        }

        res.json({
            totalScreenTime: totalOnlineTime,
            longestSleep: longestSleep,
            avgOnlineRtt: onlineCount > 0 ? onlineRttSum / onlineCount : 0,
            avgStandbyRtt: standbyCount > 0 ? standbyRttSum / standbyCount : 0
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

let sock: any;
let isWhatsAppConnected = false;
const trackers: Map<string, WhatsAppTracker> = new Map(); // JID -> Tracker instance

async function connectToWhatsApp() {
    const authDir = process.env.WA_AUTH_DIR || 'auth_info_baileys';
    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'debug' }),
        markOnlineOnConnect: true,
        // Print QR in terminal so you can scan directly from server console
        printQRInTerminal: true,
    });

    sock.ev.on('connection.update', async (update: any) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('QR Code generated');
            io.emit('qr', qr);
        }

        if (connection === 'close') {
            isWhatsAppConnected = false;
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('connection closed, reconnecting ', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            isWhatsAppConnected = true;
            console.log('opened connection');
            io.emit('connection-open');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messaging-history.set', ({ chats, contacts, messages, isLatest }: any) => {
        console.log(`[SESSION] History sync - Chats: ${chats.length}, Contacts: ${contacts.length}, Messages: ${messages.length}, Latest: ${isLatest}`);
    });

    sock.ev.on('messages.update', (updates: any) => {
        for (const update of updates) {
            console.log(`[MSG UPDATE] JID: ${update.key.remoteJid}, ID: ${update.key.id}, Status: ${update.update.status}, FromMe: ${update.key.fromMe}`);
        }
    });
}

connectToWhatsApp();

io.on('connection', (socket) => {
    console.log('Client connected');

    if (isWhatsAppConnected) {
        socket.emit('connection-open');
    }

    socket.emit('tracked-contacts', Array.from(trackers.keys()));

    socket.on('add-contact', async (number: string) => {
        console.log(`Request to track: ${number}`);
        const cleanNumber = number.replace(/\D/g, '');
        const targetJid = cleanNumber + '@s.whatsapp.net';

        if (trackers.has(targetJid)) {
            socket.emit('error', { jid: targetJid, message: 'Already tracking this contact' });
            return;
        }

        try {
            const results = await sock.onWhatsApp(targetJid);
            const result = results?.[0];

            if (result?.exists) {
                const tracker = new WhatsAppTracker(sock, result.jid);
                trackers.set(result.jid, tracker);

                tracker.onUpdate = (data) => {
                    io.emit('tracker-update', {
                        jid: result.jid,
                        ...data
                    });
                };

                tracker.startTracking();

                const ppUrl = await tracker.getProfilePicture();

                let contactName = cleanNumber;
                try {
                    const contactInfo = await sock.onWhatsApp(result.jid);
                    if (contactInfo && contactInfo[0]?.notify) {
                        contactName = contactInfo[0].notify;
                    }
                } catch (err) {
                    console.log('[NAME] Could not fetch contact name, using number');
                }

                socket.emit('contact-added', { jid: result.jid, number: cleanNumber });

                io.emit('profile-pic', { jid: result.jid, url: ppUrl });
                io.emit('contact-name', { jid: result.jid, name: contactName });
            } else {
                socket.emit('error', { jid: targetJid, message: 'Number not on WhatsApp' });
            }
        } catch (err) {
            console.error(err);
            socket.emit('error', { jid: targetJid, message: 'Verification failed' });
        }
    });

    socket.on('remove-contact', (jid: string) => {
        console.log(`Request to stop tracking: ${jid}`);
        const tracker = trackers.get(jid);
        if (tracker) {
            tracker.stopTracking();
            trackers.delete(jid);
            socket.emit('contact-removed', jid);
        }
    });
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
