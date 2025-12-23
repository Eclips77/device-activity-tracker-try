import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Metric {
    timestamp: string;
    rtt: number;
    state: string;
}

interface TimelineGraphProps {
    data: Metric[];
}

const TimelineGraph: React.FC<TimelineGraphProps> = ({ data }) => {

    // Process data to add color/segments? Recharts LineChart is simple.
    // To color code segments (Green for Online, Orange for Standby), we can use multiple lines or dot coloring.
    // For a simple line chart, we can just show the RTT line.

    // Formatting timestamp
    const formattedData = data.map(d => ({
        ...d,
        time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        val: d.rtt > 5000 ? 5000 : d.rtt // Cap visually
    }));

    return (
        <div className="w-full h-full p-4 bg-surface/50 rounded-lg border border-white/5 flex flex-col">
            <h3 className="text-sm font-bold text-muted uppercase tracking-widest mb-4">24h RTT History</h3>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formattedData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis
                            dataKey="time"
                            stroke="#666"
                            tick={{fontSize: 12}}
                            minTickGap={50}
                        />
                        <YAxis
                            stroke="#666"
                            tick={{fontSize: 12}}
                            label={{ value: 'RTT (ms)', angle: -90, position: 'insideLeft', fill: '#666' }}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
                            itemStyle={{ color: '#00ff9d' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="val"
                            stroke="#00ff9d"
                            strokeWidth={1}
                            dot={false}
                            activeDot={{ r: 4, fill: 'white' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TimelineGraph;
