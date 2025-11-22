import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface ElevationPoint {
  distance: number;
  elevation: number;
}

interface ElevationChartProps {
  data: ElevationPoint[];
  unit: 'mi' | 'km';
  onToggleCollapse?: () => void;
  onHoverPosition?: (distance: number | null) => void;
}

export default function ElevationChart({ data, unit, onToggleCollapse, onHoverPosition }: ElevationChartProps) {
  const elevationUnit = unit === 'mi' ? 'ft' : 'm';
  
  // Smooth the elevation data to reduce noise
  const smoothData = (rawData: ElevationPoint[]): ElevationPoint[] => {
    if (rawData.length < 3) return rawData;
    
    const smoothed: ElevationPoint[] = [];
    const windowSize = 3; // Simple moving average window
    
    for (let i = 0; i < rawData.length; i++) {
      let sum = 0;
      let count = 0;
      
      // Average over window around current point
      for (let j = Math.max(0, i - Math.floor(windowSize / 2)); 
           j <= Math.min(rawData.length - 1, i + Math.floor(windowSize / 2)); 
           j++) {
        sum += rawData[j].elevation;
        count++;
      }
      
      smoothed.push({
        distance: rawData[i].distance,
        elevation: sum / count
      });
    }
    
    return smoothed;
  };
  
  const smoothedData = smoothData(data);
  
  const formattedData = smoothedData.map(point => ({
    distance: unit === 'mi' 
      ? (point.distance * 0.000621371).toFixed(2)
      : (point.distance / 1000).toFixed(2),
    elevation: unit === 'mi'
      ? Math.round(point.elevation * 3.28084)
      : point.elevation,
  }));

  // Calculate the actual elevation range for better Y-axis scaling
  const elevations = formattedData.map(d => parseFloat(d.elevation.toString()));
  const minElevation = Math.min(...elevations);
  const maxElevation = Math.max(...elevations);
  const elevationRange = maxElevation - minElevation;
  
  // Set domain with padding but focused on actual range
  const yAxisDomain = [
    Math.max(0, minElevation - elevationRange * 0.1), // Small padding below, but not below 0
    maxElevation + elevationRange * 0.1 // Small padding above
  ];

  if (data.length === 0) {
    return (
      <Card className="bg-white shadow-lg p-6 border-2" data-testid="card-elevation-chart">
        <h3 className="text-lg font-semibold mb-2">Elevation Profile</h3>
        <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
          Click on the map to create a route
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-lg p-6 border-2" data-testid="card-elevation-chart">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Elevation Profile</h3>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Hide
          </button>
        )}
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart 
          data={formattedData}
          onMouseMove={(e) => {
            if (e && e.activeLabel && onHoverPosition) {
              // Convert the activeLabel (formatted distance) back to actual distance
              const formattedDistance = parseFloat(e.activeLabel);
              const actualDistance = unit === 'mi' 
                ? formattedDistance / 0.000621371 
                : formattedDistance * 1000;
              onHoverPosition(actualDistance);
            }
          }}
          onMouseLeave={() => {
            if (onHoverPosition) {
              onHoverPosition(null);
            }
          }}
        >
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
            domain={yAxisDomain}
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
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
