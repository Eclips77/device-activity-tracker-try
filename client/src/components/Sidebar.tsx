import React from 'react';
import { User, Activity } from 'lucide-react';
import { cn } from '../utils/cn';

interface Contact {
  jid: string;
  name?: string;
  state?: 'Online' | 'Standby' | 'Offline' | 'Calibrating...' | 'An (Online)';
}

interface SidebarProps {
  contacts: Contact[];
  selectedJid: string | null;
  onSelect: (jid: string) => void;
  onAddContact: (number: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ contacts, selectedJid, onSelect, onAddContact }) => {
  const [newNumber, setNewNumber] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNumber) {
      onAddContact(newNumber);
      setNewNumber('');
    }
  };

  return (
    <div className="w-80 h-full bg-surface border-r border-white/10 flex flex-col">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold flex items-center gap-2 text-primary tracking-wider">
          <Activity className="w-6 h-6" />
          NET_WATCH
        </h1>
        <p className="text-xs text-muted mt-1 font-mono">RTT-BASED ACTIVITY TRACKER</p>
      </div>

      <div className="p-4 border-b border-white/10">
        <form onSubmit={handleSubmit} className="flex gap-2">
            <input
                type="text"
                placeholder="Add Number (e.g. 1234567890)"
                className="w-full bg-black/30 border border-white/20 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary font-mono text-white"
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
            />
            <button type="submit" className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 rounded px-3 transition-colors">
                +
            </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {contacts.length === 0 && (
            <div className="text-center text-muted text-sm mt-10 p-4">
                No targets tracked. <br/> Add a number to begin monitoring.
            </div>
        )}
        {contacts.map((contact) => (
          <div
            key={contact.jid}
            onClick={() => onSelect(contact.jid)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-md cursor-pointer transition-all mb-1 font-mono group",
              selectedJid === contact.jid ? "bg-primary/10 border border-primary/30" : "hover:bg-white/5 border border-transparent"
            )}
          >
            <div className="relative">
                <div className="w-10 h-10 rounded-full bg-surfaceHighlight flex items-center justify-center text-muted group-hover:text-white transition-colors">
                    <User className="w-5 h-5" />
                </div>
                <div className={cn(
                    "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface",
                    contact.state === 'Online' || contact.state === 'An (Online)' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" :
                    contact.state === 'Standby' ? "bg-orange-500" :
                    contact.state === 'Offline' ? "bg-red-500" : "bg-gray-500"
                )} />
            </div>

            <div className="overflow-hidden">
                <div className="font-semibold truncate text-sm">{contact.name || contact.jid.split('@')[0]}</div>
                <div className="text-xs text-muted truncate">{contact.state || 'Unknown'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
