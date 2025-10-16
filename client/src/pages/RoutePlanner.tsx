import { useState } from 'react';
import MapContainer from '@/components/MapContainer';
import RouteStats from '@/components/RouteStats';
import MapControls from '@/components/MapControls';
import MapTypeToggle from '@/components/MapTypeToggle';
import ElevationChart from '@/components/ElevationChart';
import ExportDialog from '@/components/ExportDialog';
import RouteActions from '@/components/RouteActions';
import ThemeToggle from '@/components/ThemeToggle';

interface RoutePoint {
  lat: number;
  lng: number;
  elevation?: number;
}

export default function RoutePlanner() {
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [distance, setDistance] = useState(0);
  const [unit, setUnit] = useState<'mi' | 'km'>('mi');
  const [mapType, setMapType] = useState<'map' | 'satellite'>('map');

  const handleRouteChange = (points: RoutePoint[], newDistance: number) => {
    setRoutePoints(points);
    setDistance(newDistance);
  };

  const handleUndo = () => {
    if (routePoints.length > 0) {
      const newPoints = routePoints.slice(0, -1);
      setRoutePoints(newPoints);
      console.log('Undo last point');
    }
  };

  const handleClear = () => {
    setRoutePoints([]);
    setDistance(0);
    console.log('Clear route');
    window.location.reload();
  };

  const elevationData = routePoints.map((point, index) => {
    let totalDistance = 0;
    for (let i = 0; i < index; i++) {
      const dx = routePoints[i + 1].lng - routePoints[i].lng;
      const dy = routePoints[i + 1].lat - routePoints[i].lat;
      totalDistance += Math.sqrt(dx * dx + dy * dy) * 111320;
    }
    return {
      distance: totalDistance,
      elevation: point.elevation || 0,
    };
  });

  const elevationGain = routePoints.reduce((gain, point, index) => {
    if (index === 0) return 0;
    const diff = (point.elevation || 0) - (routePoints[index - 1].elevation || 0);
    return gain + (diff > 0 ? diff : 0);
  }, 0);

  const elevationLoss = routePoints.reduce((loss, point, index) => {
    if (index === 0) return 0;
    const diff = (point.elevation || 0) - (routePoints[index - 1].elevation || 0);
    return loss + (diff < 0 ? Math.abs(diff) : 0);
  }, 0);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <MapContainer 
        onRouteChange={handleRouteChange}
        mapType={mapType}
      />

      <div className="absolute top-4 left-4 z-[1000] space-y-4">
        <RouteStats 
          distance={distance}
          unit={unit}
          elevationGain={elevationGain}
          elevationLoss={elevationLoss}
          onUnitToggle={() => setUnit(unit === 'mi' ? 'km' : 'mi')}
        />
      </div>

      <div className="absolute top-4 right-4 z-[1000]">
        <MapControls 
          onZoomIn={() => console.log('Zoom in')}
          onZoomOut={() => console.log('Zoom out')}
          onLocate={() => console.log('Locate')}
          onFitRoute={() => console.log('Fit route')}
        />
      </div>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex gap-2">
        <MapTypeToggle 
          mapType={mapType}
          onToggle={setMapType}
        />
        <ThemeToggle />
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-[1000] space-y-4">
        <ElevationChart 
          data={elevationData}
          unit={unit}
        />
        
        <div className="flex justify-between items-center gap-4">
          <RouteActions 
            onUndo={handleUndo}
            onClear={handleClear}
            canUndo={routePoints.length > 0}
          />
          
          <ExportDialog 
            routePoints={routePoints}
          />
        </div>
      </div>
    </div>
  );
}
