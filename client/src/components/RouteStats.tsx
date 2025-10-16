import { ArrowUp, ArrowDown } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface RouteStatsProps {
  distance: number;
  unit: 'mi' | 'km';
  elevationGain?: number;
  elevationLoss?: number;
  onUnitToggle?: () => void;
}

export default function RouteStats({ 
  distance, 
  unit, 
  elevationGain = 0, 
  elevationLoss = 0,
  onUnitToggle 
}: RouteStatsProps) {
  const displayDistance = unit === 'mi' 
    ? (distance * 0.000621371).toFixed(2)
    : (distance / 1000).toFixed(2);

  const elevationUnit = unit === 'mi' ? 'ft' : 'm';
  const displayElevationGain = unit === 'mi' 
    ? Math.round(elevationGain * 3.28084)
    : elevationGain;
  const displayElevationLoss = unit === 'mi'
    ? Math.round(elevationLoss * 3.28084)
    : elevationLoss;

  return (
    <Card className="backdrop-blur-lg bg-card/95 shadow-2xl p-6" data-testid="card-route-stats">
      <div className="space-y-4">
        <div>
          <div className="flex items-baseline gap-2">
            <span 
              className="text-5xl font-bold font-mono tracking-tight cursor-pointer hover-elevate active-elevate-2 px-2 py-1 rounded-md transition-colors"
              onClick={onUnitToggle}
              data-testid="text-distance"
            >
              {displayDistance}
            </span>
            <span 
              className="text-2xl font-semibold text-muted-foreground cursor-pointer"
              onClick={onUnitToggle}
              data-testid="button-unit-toggle"
            >
              {unit}
            </span>
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
            Total Distance
          </p>
        </div>

        {(elevationGain > 0 || elevationLoss > 0) && (
          <div className="flex gap-6 pt-2 border-t">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-chart-2/10">
                <ArrowUp className="w-4 h-4 text-chart-2" />
              </div>
              <div>
                <div className="text-lg font-mono font-semibold" data-testid="text-elevation-gain">
                  {displayElevationGain}
                </div>
                <div className="text-xs text-muted-foreground">
                  {elevationUnit} gain
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-destructive/10">
                <ArrowDown className="w-4 h-4 text-destructive" />
              </div>
              <div>
                <div className="text-lg font-mono font-semibold" data-testid="text-elevation-loss">
                  {displayElevationLoss}
                </div>
                <div className="text-xs text-muted-foreground">
                  {elevationUnit} loss
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
