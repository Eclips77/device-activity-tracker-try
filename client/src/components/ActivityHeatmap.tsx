import React from 'react';

interface Metric {
    timestamp: string;
    rtt: number;
    state: string;
}

interface ActivityHeatmapProps {
    data: Metric[];
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ data }) => {
    // Group data by hour
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const activityPerHour = new Array(24).fill(0);

    // We assume data is sorted.
    // We want to calculate "intensity" (e.g. % of time online) per hour.
    // Simplified: Count 'Online' points per hour vs total points.

    const pointsPerHour = new Array(24).fill(0);

    data.forEach(m => {
        const date = new Date(m.timestamp);
        const hour = date.getHours();
        pointsPerHour[hour]++;
        if (m.state === 'Online') {
            activityPerHour[hour]++;
        }
    });

    // Normalize
    const intensity = activityPerHour.map((count, i) => {
        if (pointsPerHour[i] === 0) return 0;
        return count / pointsPerHour[i];
    });

    return (
        <div className="w-full h-full p-4 bg-surface/50 rounded-lg border border-white/5 flex flex-col">
             <h3 className="text-sm font-bold text-muted uppercase tracking-widest mb-4">Hourly Activity Intensity</h3>
             <div className="flex-1 flex items-end gap-1">
                {hours.map(hour => {
                    const val = intensity[hour];
                    // Height based on value
                    const height = `${Math.max(val * 100, 5)}%`;

                    // Color: Darker for low activity, Bright Green for high
                    // We can use opacity of primary color
                    const opacity = Math.max(val, 0.2);

                    return (
                        <div key={hour} className="flex-1 flex flex-col items-center group relative">
                             {/* Bar */}
                             <div
                                className="w-full bg-primary rounded-t-sm transition-all duration-500 hover:bg-white"
                                style={{ height, opacity }}
                             ></div>
                             {/* Label */}
                             <div className="text-[10px] text-muted mt-2 font-mono">{hour}</div>

                             {/* Tooltip */}
                             <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black border border-white/20 p-2 rounded text-xs z-10 whitespace-nowrap">
                                Hour: {hour}:00 <br/>
                                Activity: {(val * 100).toFixed(1)}%
                             </div>
                        </div>
                    )
                })}
             </div>
        </div>
    );
};

export default ActivityHeatmap;
