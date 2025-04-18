'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from "@/lib/utils";

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload) return null;

  const data = payload[0].payload;
  
  return (
    <div className="rounded-md bg-background p-4 shadow-lg border">
      <p className="font-medium">{data.contestTitle}</p>
      <p className="text-sm">Rating: {data.newrating}</p>
      <p className="text-xs text-muted-foreground">
        {new Date(data.timestamp).toLocaleDateString()}
      </p>
    </div>
  );
};

export function RatingChart({ data }: { data: Array<{
  newrating: number;
  timestamp: string;
  contestTitle: string;
}> }) {
  return (
    <div className={cn("rounded-xl p-6", "bg-background")}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-muted-foreground/20"
          />
          <XAxis
            dataKey="timestamp"
            stroke="hsl(var(--foreground))"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(value) => new Date(value).toLocaleDateString()}
          />
          <YAxis
            stroke="hsl(var(--foreground))"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="newrating"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 4, fill: "hsl(var(--primary))" }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}