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
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
};

const InsightsCard: React.FC<InsightsCardProps> = ({ data }) => {
    if (!data) return <div className="animate-pulse bg-surface/30 h-32 rounded-lg"></div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Active Time */}
            <div className="bg-surface/50 border border-white/5 p-4 rounded-lg flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full text-primary">
                    <Clock className="w-6 h-6" />
                </div>
                <div>
                    <div className="text-sm text-muted">Total Active Time</div>
                    <div className="text-xl font-bold font-mono text-white">{formatDuration(data.totalScreenTime)}</div>
                </div>
            </div>

            {/* Estimated Sleep */}
            <div className="bg-surface/50 border border-white/5 p-4 rounded-lg flex items-center gap-4">
                <div className="p-3 bg-secondary/10 rounded-full text-secondary">
                    <Moon className="w-6 h-6" />
                </div>
                <div>
                    <div className="text-sm text-muted">Est. Longest Sleep</div>
                    <div className="text-xl font-bold font-mono text-white">{formatDuration(data.longestSleep)}</div>
                </div>
            </div>

             {/* Avg RTT Stats */}
             <div className="bg-surface/50 border border-white/5 p-4 rounded-lg flex items-center gap-4">
                <div className="p-3 bg-danger/10 rounded-full text-danger">
                    <Zap className="w-6 h-6" />
                </div>
                <div>
                    <div className="text-sm text-muted">Avg RTT (On/Stb)</div>
                    <div className="text-xl font-bold font-mono text-white">
                        {data.avgOnlineRtt.toFixed(0)} / {data.avgStandbyRtt.toFixed(0)} <span className="text-xs text-muted">ms</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InsightsCard;
