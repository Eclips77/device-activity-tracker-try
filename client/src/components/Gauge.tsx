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
  const iR = 60;
  const oR = 80;

  // Color interpolation based on value (Green -> Orange -> Red for RTT)
  let color = '#22c55e'; // Green
  if (value > 2000) color = '#ef4444'; // Red
  else if (value > 1000) color = '#f97316'; // Orange

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-surface/50 rounded-lg border border-white/5 relative h-[220px]">
      <h3 className="text-sm font-bold text-muted uppercase tracking-widest absolute top-4 left-4">{label}</h3>

      <div className="relative mt-4">
        <PieChart width={200} height={120}>
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
            >
                <Cell fill={color} />
                <Cell fill="#333" />
            </Pie>
        </PieChart>
        <div className="absolute top-[85px] left-0 right-0 text-center">
             <div className="text-3xl font-mono font-bold text-white" style={{color}}>
                {value.toFixed(0)}
             </div>
             <div className="text-xs text-muted">{unit}</div>
        </div>
      </div>
    </div>
  );
};

export default Gauge;
