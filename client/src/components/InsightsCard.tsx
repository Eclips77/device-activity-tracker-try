import React from 'react';
import { Moon, Clock, Zap } from 'lucide-react';

interface AnalysisData {
    totalScreenTime: number; // in ms
    longestSleep: number; // in ms
    avgOnlineRtt: number;
    avgStandbyRtt: number;
}

interface InsightsCardProps {
    data: AnalysisData | null;
}

const formatDuration = (ms: number) => {
    if (ms <= 0) return '0h 0m';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
};

const InsightsCard: React.FC<InsightsCardProps> = ({ data }) => {
    // Graceful handling of null/undefined
    const displayData = data || {
        totalScreenTime: 0,
        longestSleep: 0,
        avgOnlineRtt: 0,
        avgStandbyRtt: 0
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Active Time */}
            <div className="bg-surface/50 border border-white/5 p-4 rounded-lg flex items-center gap-4 hover:border-primary/20 transition-colors">
                <div className="p-3 bg-primary/10 rounded-full text-primary">
                    <Clock className="w-6 h-6" />
                </div>
                <div>
                    <div className="text-xs text-muted uppercase tracking-wider">Total Active Time</div>
                    <div className="text-xl font-bold font-mono text-white mt-1">{formatDuration(displayData.totalScreenTime)}</div>
                </div>
            </div>

            {/* Estimated Sleep */}
            <div className="bg-surface/50 border border-white/5 p-4 rounded-lg flex items-center gap-4 hover:border-secondary/20 transition-colors">
                <div className="p-3 bg-blue-500/10 rounded-full text-blue-500">
                    <Moon className="w-6 h-6" />
                </div>
                <div>
                    <div className="text-xs text-muted uppercase tracking-wider">Longest Inactivity</div>
                    <div className="text-xl font-bold font-mono text-white mt-1">{formatDuration(displayData.longestSleep)}</div>
                </div>
            </div>

             {/* Avg RTT Stats */}
             <div className="bg-surface/50 border border-white/5 p-4 rounded-lg flex items-center gap-4 hover:border-yellow-500/20 transition-colors">
                <div className="p-3 bg-yellow-500/10 rounded-full text-yellow-500">
                    <Zap className="w-6 h-6" />
                </div>
                <div>
                    <div className="text-xs text-muted uppercase tracking-wider">Avg Latency (On/Off)</div>
                    <div className="text-xl font-bold font-mono text-white mt-1">
                        {displayData.avgOnlineRtt.toFixed(0)} <span className="text-muted text-sm mx-1">/</span> {displayData.avgStandbyRtt.toFixed(0)} <span className="text-xs text-muted">ms</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InsightsCard;
