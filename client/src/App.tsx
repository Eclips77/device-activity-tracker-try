import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import Gauge from './components/Gauge';
import TimelineGraph from './components/TimelineGraph';
import ActivityHeatmap from './components/ActivityHeatmap';
import InsightsCard from './components/InsightsCard';
import { Smartphone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const SOCKET_URL = '/'; // Proxy handles this

interface Contact {
  jid: string;
  name?: string;
  state?: 'Online' | 'Standby' | 'Offline' | 'Calibrating...' | 'An (Online)';
  rtt?: number;
}

function App() {
  const [socket, setSocket] = useState<any>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedJid, setSelectedJid] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize Socket
  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
        console.log('Socket connected');
    });

    newSocket.on('qr', (qr) => {
        setQrCode(qr);
    });

    newSocket.on('connection-open', () => {
        setIsConnected(true);
        setQrCode(null);
    });

    newSocket.on('contact-added', ({ jid, number }: any) => {
        setContacts(prev => {
            if (prev.find(c => c.jid === jid)) return prev;
            return [...prev, { jid, name: number }];
        });
    });

    newSocket.on('contact-removed', (jid: string) => {
        setContacts(prev => prev.filter(c => c.jid !== jid));
        if (selectedJid === jid) setSelectedJid(null);
    });

    newSocket.on('tracker-update', (data: any) => {
        setContacts(prev => prev.map(c => {
            if (c.jid === data.jid) {
                return { ...c, state: data.devices?.find((d: any) => d.jid === data.jid)?.state || c.state, rtt: data.devices?.find((d: any) => d.jid === data.jid)?.rtt || 0 };
            }
            return c;
        }));
    });

    // Initial fetch of contacts (if server supports it)
    newSocket.on('tracked-contacts', (jids: string[]) => {
        // We might not have names, just JIDs
        setContacts(prev => {
            const existing = new Set(prev.map(c => c.jid));
            const newContacts = jids.filter(jid => !existing.has(jid)).map(jid => ({ jid }));
            return [...prev, ...newContacts];
        });
    });

    newSocket.on('contact-name', ({ jid, name }: any) => {
         setContacts(prev => prev.map(c => c.jid === jid ? { ...c, name } : c));
    });

    return () => {
        newSocket.close();
    };
  }, []);

  // Fetch History & Analysis when selectedJid changes
  useEffect(() => {
    if (!selectedJid) return;

    const fetchData = async () => {
        try {
            const [histRes, analRes] = await Promise.all([
                axios.get(`/api/history/${selectedJid}`),
                axios.get(`/api/analysis/${selectedJid}`)
            ]);
            setHistory(histRes.data);
            setAnalysis(analRes.data);
        } catch (err) {
            console.error("Error fetching data", err);
        }
    };

    fetchData();
    // Poll every 30s? Or just rely on updates.
    // Ideally we append real-time updates to history, but fetching is easier for MVP.
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);

  }, [selectedJid]);

  const handleAddContact = (number: string) => {
    socket?.emit('add-contact', number);
  };

  const selectedContact = contacts.find(c => c.jid === selectedJid);

  if (!isConnected && qrCode) {
      return (
          <div className="flex h-screen w-screen items-center justify-center bg-background text-white flex-col gap-8">
              <h1 className="text-3xl font-bold text-primary">WhatsApp Tracker Setup</h1>
              <div className="p-4 bg-white rounded-lg">
                  <QRCodeSVG value={qrCode} size={256} />
              </div>
              <p className="text-muted">Scan with WhatsApp Linked Devices to start server session.</p>
          </div>
      )
  }

  return (
    <div className="flex h-screen w-screen bg-background text-text overflow-hidden font-sans">
      <Sidebar
        contacts={contacts}
        selectedJid={selectedJid}
        onSelect={setSelectedJid}
        onAddContact={handleAddContact}
      />

      <main className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto">
        {!selectedJid ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted gap-4">
                <Smartphone className="w-16 h-16 opacity-20" />
                <p>Select a contact to view activity analytics</p>
            </div>
        ) : (
            <>
                <div className="flex justify-between items-end border-b border-white/10 pb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white">{selectedContact?.name || selectedJid}</h2>
                        <div className="flex items-center gap-2 text-sm">
                            <span className={selectedContact?.state === 'Online' || selectedContact?.state === 'An (Online)' ? 'text-primary' : 'text-muted'}>
                                {selectedContact?.state || 'Unknown'}
                            </span>
                            <span className="text-muted">•</span>
                            <span className="text-muted font-mono">{selectedJid}</span>
                        </div>
                    </div>
                    {/* Could add controls here */}
                </div>

                {/* Top Row: Gauge & Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1">
                        <Gauge
                            value={selectedContact?.rtt || 0}
                            min={0}
                            max={5000}
                            label="Live RTT"
                            unit="ms"
                        />
                    </div>
                    <div className="lg:col-span-3">
                         <div className="h-full flex flex-col justify-between gap-6">
                            <InsightsCard data={analysis} />
                            {/* Placeholder or mini stats */}
                            <div className="flex-1 bg-surface/30 rounded-lg border border-white/5 p-4 flex items-center justify-center text-muted text-sm italic">
                                "Real-time surveillance provided by RTT side-channel analysis"
                            </div>
                         </div>
                    </div>
                </div>

                {/* Middle: Timeline */}
                <div className="h-[300px]">
                    <TimelineGraph data={history} />
                </div>

                {/* Bottom: Heatmap */}
                <div className="h-[200px]">
                    <ActivityHeatmap data={history} />
                </div>
            </>
        )}
      </main>
    </div>
  );
}

export default App;
