import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface ElevationPoint {
  distance: number;
  elevation: number;
}

interface ElevationChartProps {
  data: ElevationPoint[];
  unit: 'mi' | 'km';
}

export default function ElevationChart({ data, unit }: ElevationChartProps) {
  const elevationUnit = unit === 'mi' ? 'ft' : 'm';
  
  const formattedData = data.map(point => ({
    distance: unit === 'mi' 
      ? (point.distance * 0.000621371).toFixed(2)
      : (point.distance / 1000).toFixed(2),
    elevation: unit === 'mi'
      ? Math.round(point.elevation * 3.28084)
      : point.elevation,
  }));

  if (data.length === 0) {
    return (
      <Card className="backdrop-blur-lg bg-card/95 shadow-lg p-6" data-testid="card-elevation-chart">
        <h3 className="text-lg font-semibold mb-2">Elevation Profile</h3>
        <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
          Click on the map to create a route
        </div>
      </Card>
    );
  }

  return (
    <Card className="backdrop-blur-lg bg-card/95 shadow-lg p-6" data-testid="card-elevation-chart">
      <h3 className="text-lg font-semibold mb-4">Elevation Profile</h3>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={formattedData}>
          <defs>
            <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="distance" 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            stroke="hsl(var(--border))"
          />
          <YAxis 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            stroke="hsl(var(--border))"
            label={{ 
              value: elevationUnit, 
              angle: -90, 
              position: 'insideLeft',
              style: { fill: 'hsl(var(--muted-foreground))', fontSize: 12 }
            }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.375rem',
              fontSize: '12px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Area
            type="monotone"
            dataKey="elevation"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            fill="url(#elevationGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
