import { useState, useRef, useEffect } from 'react';
import MapContainer from '@/components/MapContainer';
import RouteStats from '@/components/RouteStats';
import MapControls from '@/components/MapControls';
import MapTypeToggle, { MapType } from '@/components/MapTypeToggle';
import ElevationChart from '@/components/ElevationChart';
import ExportDialog from '@/components/ExportDialog';
import RouteActions from '@/components/RouteActions';
import ThemeToggle from '@/components/ThemeToggle';
import LocationSearch from '@/components/LocationSearch';
import FreehandToggle from '@/components/FreehandToggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RoutePoint {
  lat: number;
  lng: number;
  elevation?: number;
}

type RoutingService = 'openrouteservice' | 'osrm' | 'mapbox' | 'thunderforest' | 'straight';
type ElevationService = 'open-elevation' | 'mapbox' | 'usgs' | 'none';

export default function RoutePlanner() {
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [distance, setDistance] = useState(0);
  const [unit, setUnit] = useState<'mi' | 'km'>('mi');
  const [mapType, setMapType] = useState<MapType>('map');
  const [routeElevations, setRouteElevations] = useState<number[]>([]);
  const [elevationData, setElevationData] = useState<{distance: number, elevation: number}[]>([]);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [fullRouteCoords, setFullRouteCoords] = useState<RoutePoint[]>([]);
  const [routingService, setRoutingService] = useState<RoutingService>('openrouteservice');
  const [elevationService, setElevationService] = useState<ElevationService>('open-elevation');
  const [isFreehand, setIsFreehand] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{
    routingService: string;
    elevationService: string;
    lastElevationCall?: string;
    lastRoutingCall?: string;
    elevationStatus?: 'pending' | 'success' | 'error';
    routingStatus?: 'pending' | 'success' | 'error';
  }>({
    routingService: 'openrouteservice',
    elevationService: 'open-elevation'
  });

  // Update debug info when services change
  useEffect(() => {
    setDebugInfo(prev => ({
      ...prev,
      routingService,
      elevationService
    }));
  }, [routingService, elevationService]);

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
    }
  };

  const handleClear = () => {
    setRoutePoints([]);
    setRouteElevations([]);
    setElevationData([]);
    setFullRouteCoords([]);
    setDistance(0);
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
        routingService={routingService}
        elevationService={elevationService}
        isFreehand={isFreehand}
        onDebugUpdate={setDebugInfo}
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
          <FreehandToggle 
            isFreehand={isFreehand}
            onToggle={setIsFreehand}
          />
          <MapTypeToggle 
            mapType={mapType}
            onToggle={setMapType}
          />
          <Select value={routingService} onValueChange={(value: RoutingService) => setRoutingService(value)}>
            <SelectTrigger className="w-48 bg-white shadow-lg">
              <SelectValue placeholder="Select routing service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openrouteservice">OpenRouteService</SelectItem>
              <SelectItem value="osrm">OSRM</SelectItem>
              <SelectItem value="mapbox">Mapbox</SelectItem>
              <SelectItem value="thunderforest">Thunderforest</SelectItem>
              <SelectItem value="straight">Straight Lines</SelectItem>
            </SelectContent>
          </Select>
          <Select value={elevationService} onValueChange={(value: ElevationService) => setElevationService(value)}>
            <SelectTrigger className="w-44 bg-white shadow-lg">
              <SelectValue placeholder="Select elevation service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open-elevation">Open-Elevation</SelectItem>
              <SelectItem value="mapbox">
                <div className="flex flex-col">
                  <span>Mapbox Elevation</span>
                  <span className="text-xs text-gray-500">⚠️ Requires token</span>
                </div>
              </SelectItem>
              <SelectItem value="usgs">USGS Elevation</SelectItem>
              <SelectItem value="none">No Elevation</SelectItem>
            </SelectContent>
          </Select>
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

      {/* Debug Panel */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-lg max-w-xs">
        <div className="text-xs font-semibold text-gray-700 mb-2">API Debug Info</div>
        <div className="space-y-1 text-xs">
          <div><span className="font-medium">Routing:</span> {debugInfo.routingService}</div>
          <div><span className="font-medium">Elevation:</span> {debugInfo.elevationService}</div>
          {(debugInfo.routingService === 'mapbox' || debugInfo.elevationService === 'mapbox') && (
            <div className="text-xs text-orange-600 bg-orange-50 p-1 rounded">
              ⚠️ Mapbox requires token & has usage limits
            </div>
          )}
          {debugInfo.lastElevationCall && (
            <div className="mt-2">
              <div className="font-medium">Last Elevation Call:</div>
              <div className={`text-xs break-all ${debugInfo.elevationStatus === 'success' ? 'text-green-600' : debugInfo.elevationStatus === 'error' ? 'text-red-600' : 'text-blue-600'}`}>
                {debugInfo.lastElevationCall}
              </div>
              {debugInfo.elevationStatus && (
                <div className={`text-xs font-medium ${debugInfo.elevationStatus === 'success' ? 'text-green-600' : debugInfo.elevationStatus === 'error' ? 'text-red-600' : 'text-blue-600'}`}>
                  Status: {debugInfo.elevationStatus}
                </div>
              )}
            </div>
          )}
          {debugInfo.lastRoutingCall && (
            <div className="mt-2">
              <div className="font-medium">Last Routing Call:</div>
              <div className={`text-xs break-all ${debugInfo.routingStatus === 'success' ? 'text-green-600' : debugInfo.routingStatus === 'error' ? 'text-red-600' : 'text-blue-600'}`}>
                {debugInfo.lastRoutingCall}
              </div>
              {debugInfo.routingStatus && (
                <div className={`text-xs font-medium ${debugInfo.routingStatus === 'success' ? 'text-green-600' : debugInfo.routingStatus === 'error' ? 'text-red-600' : 'text-blue-600'}`}>
                  Status: {debugInfo.routingStatus}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
