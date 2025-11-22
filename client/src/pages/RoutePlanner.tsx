import { useState, useRef } from 'react';
import MapContainer from '@/components/MapContainer';
import RouteStats from '@/components/RouteStats';
import MapControls from '@/components/MapControls';
import MapTypeToggle, { MapType } from '@/components/MapTypeToggle';
import ElevationChart from '@/components/ElevationChart';
import ExportDialog from '@/components/ExportDialog';
import RouteActions from '@/components/RouteActions';
import ThemeToggle from '@/components/ThemeToggle';
import LocationSearch from '@/components/LocationSearch';

interface RoutePoint {
  lat: number;
  lng: number;
  elevation?: number;
}

export default function RoutePlanner() {
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [distance, setDistance] = useState(0);
  const [unit, setUnit] = useState<'mi' | 'km'>('mi');
  const [mapType, setMapType] = useState<MapType>('map');
  const [routeElevations, setRouteElevations] = useState<number[]>([]);
  const [elevationData, setElevationData] = useState<{distance: number, elevation: number}[]>([]);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [fullRouteCoords, setFullRouteCoords] = useState<RoutePoint[]>([]);

  const handleRouteChange = (points: RoutePoint[], newDistance: number, elevations?: number[], elevationChartData?: {distance: number, elevation: number}[], fullCoords?: RoutePoint[]) => {
    setRoutePoints(points);
    setDistance(newDistance);
    if (elevations) {
      setRouteElevations(elevations);
    }
    if (elevationChartData) {
      setElevationData(elevationChartData);
    }
    if (fullCoords) {
      setFullRouteCoords(fullCoords);
    }
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
    setRouteElevations([]);
    setElevationData([]);
    setFullRouteCoords([]);
    setDistance(0);
    console.log('Clear route');
    window.location.reload();
  };

  const elevationGain = routeElevations.reduce((gain, elevation, index) => {
    if (index === 0) return 0;
    const diff = elevation - routeElevations[index - 1];
    return gain + (diff > 0 ? diff : 0);
  }, 0);

  const elevationLoss = routeElevations.reduce((loss, elevation, index) => {
    if (index === 0) return 0;
    const diff = elevation - routeElevations[index - 1];
    return loss + (diff < 0 ? Math.abs(diff) : 0);
  }, 0);

  const [showElevation, setShowElevation] = useState(true);
  const mapRef = useRef<any>(null);

  const handleElevationHover = (distance: number | null) => {
    setHoverPosition(distance);
  };

  const handleLocationSelect = (lat: number, lon: number) => {
    // This will be handled by MapContainer's geolocation effect
    if (mapRef.current) {
      mapRef.current.setView([lat, lon], 13);
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <MapContainer 
        onRouteChange={handleRouteChange}
        mapType={mapType}
        routePoints={routePoints}
        hoverPosition={hoverPosition}
        ref={mapRef}
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

      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <MapControls 
          onZoomIn={() => console.log('Zoom in')}
          onZoomOut={() => console.log('Zoom out')}
          onLocate={() => console.log('Locate')}
          onFitRoute={() => console.log('Fit route')}
        />
        <ThemeToggle />
      </div>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex flex-col gap-3 items-center">
        <div className="flex gap-2">
          <MapTypeToggle 
            mapType={mapType}
            onToggle={setMapType}
          />
          <RouteActions 
            onUndo={handleUndo}
            onClear={handleClear}
            canUndo={routePoints.length > 0}
          />
          <ExportDialog 
            routePoints={fullRouteCoords.length > 0 ? fullRouteCoords : routePoints}
          />
        </div>
        <div className="w-96">
          <LocationSearch onLocationSelect={handleLocationSelect} />
        </div>
      </div>

      {showElevation && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000]">
          <ElevationChart 
            data={elevationData}
            unit={unit}
            onToggleCollapse={() => setShowElevation(!showElevation)}
            onHoverPosition={handleElevationHover}
          />
        </div>
      )}
      
      {!showElevation && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000]">
          <button
            onClick={() => setShowElevation(true)}
            className="bg-white shadow-lg px-4 py-2 rounded-lg border-2 hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Show Elevation Profile
          </button>
        </div>
      )}
    </div>
  );
}
