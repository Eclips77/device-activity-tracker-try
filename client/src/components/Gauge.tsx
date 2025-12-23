import React from 'react';
import { PieChart, Pie, Cell } from 'recharts';

interface GaugeProps {
  value: number;
  label: string;
  min: number;
  max: number;
  unit: string;
}

const Gauge: React.FC<GaugeProps> = ({ value, label, min, max, unit }) => {
  const percentage = Math.min(Math.max((value - min) / (max - min), 0), 1);

  // Create data for the semi-circle gauge
  const data = [
    { name: 'value', value: percentage },
    { name: 'empty', value: 1 - percentage }
  ];

  const cx = 100;
  const cy = 100;
  const iR = 70;
  const oR = 90;

  // Color interpolation based on value (Green -> Orange -> Red for RTT)
  let color = '#22c55e'; // Green
  if (value > 2000) color = '#ef4444'; // Red
  else if (value > 500) color = '#f97316'; // Orange

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-surface/50 rounded-lg border border-white/5 relative h-full min-h-[220px]">
      <div className="w-full flex justify-between items-center absolute top-4 px-4">
        <h3 className="text-xs font-bold text-muted uppercase tracking-widest">{label}</h3>
        <span className="text-[10px] text-muted font-mono">{min}-{max}{unit}</span>
      </div>

      <div className="relative mt-4">
        <PieChart width={200} height={110}>
            <Pie
                dataKey="value"
                startAngle={180}
                endAngle={0}
                data={data}
                cx={cx}
                cy={cy}
                innerRadius={iR}
                outerRadius={oR}
                fill="#333"
                stroke="none"
                cornerRadius={5}
                paddingAngle={0}
            >
                <Cell fill={color} />
                <Cell fill="#1a1a1a" />
            </Pie>
        </PieChart>
        <div className="absolute top-[75px] left-0 right-0 text-center flex flex-col items-center">
             <div className="text-4xl font-mono font-bold tracking-tighter drop-shadow-lg" style={{color}}>
                {value.toFixed(0)}
             </div>
             <div className="text-xs text-muted font-bold mt-[-2px]">{unit}</div>
        </div>
      </div>

      <div className="text-[10px] text-muted/50 mt-2 font-mono text-center max-w-[150px]">
          Round Trip Time (RTT) indicates network latency and device activity
      </div>
    </div>
  );
};

export default Gauge;
