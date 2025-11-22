import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RoutePoint {
  lat: number;
  lng: number;
  elevation?: number;
}

type MapType = 
  | 'map' 
  | 'satellite' 
  | 'hybrid'
  | 'esri-topo';

type RoutingService = 'openrouteservice' | 'osrm' | 'mapbox' | 'thunderforest' | 'straight';

interface MapContainerProps {
  onRouteChange?: (points: RoutePoint[], distance: number, elevations?: number[], elevationData?: {distance: number, elevation: number}[], fullCoords?: RoutePoint[]) => void;
  mapType?: MapType;
  className?: string;
  routePoints?: RoutePoint[];
  hoverPosition?: number | null;
  routingService?: RoutingService;
}

const MapContainer = forwardRef<L.Map | null, MapContainerProps>(({ onRouteChange, mapType = 'map', className = '', routePoints = [], hoverPosition, routingService = 'openrouteservice' }, ref) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routePointsRef = useRef<RoutePoint[]>([]);
  const markersRef = useRef<L.Marker[]>([]);
  const polylineRef = useRef<L.Polyline | null>(null);
  const satelliteLayerRef = useRef<L.TileLayer | null>(null);
  const roadsOverlayRef = useRef<L.TileLayer | null>(null);
  const segmentLengthsRef = useRef<number[]>([]); // Store how many coords each segment adds
  const routeElevationsRef = useRef<number[]>([]); // Store all elevations along the route
  const hoverMarkerRef = useRef<L.Marker | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isProcessingClick, setIsProcessingClick] = useState(false);
  const [hasShownNetworkWarning, setHasShownNetworkWarning] = useState(false);

  // Define icons
  const greenIcon = L.icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iOCIgZmlsbD0iIzIyYzU1ZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPg==',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  const blueIcon = L.icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iOCIgZmlsbD0iIzM4OTVmZiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPg==',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  const redIcon = L.icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iOCIgZmlsbD0iI2VmNDQ0NCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPg==',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  // ✅ Single-service routing based on selected service
  const getRouteBetweenPoints = async (start: [number, number], end: [number, number]): Promise<{coords: [number, number][], elevations: number[]}> => {
    // If straight-line routing is selected
    if (routingService === 'straight') {
      return {
        coords: [start, end],
        elevations: [100, 100]
      };
    }

    // Try the selected routing service
    try {
      if (routingService === 'openrouteservice') {
        const orsResponse = await fetch(
          "https://api.openrouteservice.org/v2/directions/foot-walking/geojson",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImJjOWZhZmQ5MmY0ZDRhMjQ5ZjliYzIwMDNkNzY3MDllIiwiaCI6Im11cm11cjY0In0="
            },
            body: JSON.stringify({
              coordinates: [
                [start[1], start[0]], // ORS expects [lng, lat]
                [end[1], end[0]]
              ],
              elevation: true,
              format: "geojson"
            })
          }
        );

        if (orsResponse.ok) {
          const data = await orsResponse.json();
          const coords = data.features?.[0]?.geometry?.coordinates;
          if (coords) {
            // ORS returns [lng, lat, elevation]
            const parsedCoords: [number, number][] = [];
            const elevations: number[] = [];
            
            coords.forEach((coord: number[]) => {
              parsedCoords.push([coord[1], coord[0]]); // [lat, lng]
              elevations.push(coord[2] || 100); // elevation
            });

            return { coords: parsedCoords, elevations };
          }
        }
      } else if (routingService === 'osrm') {
        const osrmResponse = await fetch(
          `https://router.project-osrm.org/route/v1/foot/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
        );

        if (osrmResponse.ok) {
          const data = await osrmResponse.json();
          const route = data.routes?.[0];
          if (route?.geometry?.coordinates) {
            // OSRM returns [lng, lat] format
            const coords: [number, number][] = route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
            const elevations: number[] = new Array(coords.length).fill(100);
            
            return { coords, elevations };
          }
        }
      } else if (routingService === 'mapbox') {
        // Mapbox has a generous free tier (100k requests/month)
        const MAPBOX_ACCESS_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoidXBzaGF3YW0iLCJhIjoiY2x6Z3B5Z3NqMDN5ZzJqcGJzZ3p5Z3p5In0.YOUR_REAL_TOKEN_HERE';
        
        if (!MAPBOX_ACCESS_TOKEN.includes('YOUR_REAL_TOKEN_HERE')) {
          const mapboxResponse = await fetch(
            `https://api.mapbox.com/directions/v5/mapbox/walking/${start[1]},${start[0]};${end[1]},${end[0]}?geometries=geojson&overview=full&steps=false&access_token=${MAPBOX_ACCESS_TOKEN}`
          );

          if (mapboxResponse.ok) {
            const data = await mapboxResponse.json();
            const route = data.routes?.[0];
            if (route?.geometry?.coordinates) {
              // Mapbox returns [lng, lat] format
              const coords: [number, number][] = route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
              const elevations: number[] = new Array(coords.length).fill(100);
              
              return { coords, elevations };
            }
          }
        }
      } else if (routingService === 'thunderforest') {
        const thunderforestResponse = await fetch(
          `https://api.thunderforest.com/v1/routes?origin=${start[0]},${start[1]}&destination=${end[0]},${end[1]}&profile=walking&format=geojson&apikey=`
        );

        if (thunderforestResponse.ok) {
          const data = await thunderforestResponse.json();
          const coords = data.features?.[0]?.geometry?.coordinates;
          if (coords) {
            const parsedCoords: [number, number][] = coords.map((coord: number[]) => [coord[1], coord[0]]);
            const elevations: number[] = new Array(parsedCoords.length).fill(100);
            
            return { coords: parsedCoords, elevations };
          }
        }
      }
    } catch (error) {
      console.warn(`${routingService} routing failed:`, error);
    }

    // Fallback to straight-line routing if selected service fails
    console.warn(`Selected routing service (${routingService}) failed, falling back to straight lines`);
    return {
      coords: [start, end],
      elevations: [100, 100]
    };
  };

  const getElevation = async (lat: number, lng: number): Promise<number> => {
    try {
      const response = await fetch(
        `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`
      );
      
      if (!response.ok) {
        if (!hasShownNetworkWarning) {
          setHasShownNetworkWarning(true);
        }
        return 100;
      }

      const data = await response.json();
      const elevation = data.results?.[0]?.elevation;
      return elevation || 100;
    } catch (error) {
      if (!hasShownNetworkWarning) {
        setHasShownNetworkWarning(true);
      }
      return 100;
    }
  };

  const updateMarkerIcons = () => {
    markersRef.current.forEach((marker, idx) => {
      if (idx === 0) {
        marker.setIcon(greenIcon);
      } else if (idx === markersRef.current.length - 1) {
        marker.setIcon(redIcon);
      } else {
        marker.setIcon(blueIcon);
      }
    });
  };

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
    }).setView([40.7128, -74.0060], 13);

    const mapLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    });

    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles © Esri',
        maxZoom: 19,
      }
    );

    const roadsOverlay = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      opacity: 0.5,
    });

    satelliteLayerRef.current = satelliteLayer;
    roadsOverlayRef.current = roadsOverlay;

    if (mapType === 'satellite') {
      satelliteLayer.addTo(map);
    } else if (mapType === 'hybrid') {
      satelliteLayer.addTo(map);
      roadsOverlay.addTo(map);
    } else {
      mapLayer.addTo(map);
    }

    mapInstanceRef.current = map;
    setIsMapReady(true);

    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          map.setView([position.coords.latitude, position.coords.longitude], 13);
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }

    map.on('click', async (e: L.LeafletMouseEvent) => {
      if (isProcessingClick) return; // Prevent multiple clicks while processing
      
      setIsProcessingClick(true);
      
      // Get elevation for the clicked point
      const elevation = await getElevation(e.latlng.lat, e.latlng.lng);
      
      const point: RoutePoint = {
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        elevation: elevation,
      };

      const isFirst = routePointsRef.current.length === 0;

      if (!isFirst) {
        const lastPoint = routePointsRef.current[routePointsRef.current.length - 1];
        const routeData = await getRouteBetweenPoints(
          [lastPoint.lat, lastPoint.lng],
          [point.lat, point.lng]
        );

        if (polylineRef.current) {
          const existingCoords = polylineRef.current.getLatLngs() as L.LatLng[];
          const newCoords = [...existingCoords, ...routeData.coords.slice(1).map(coord => L.latLng(coord[0], coord[1]))];
          polylineRef.current.setLatLngs(newCoords);
          // Store how many coordinates this segment added (excluding the first point which overlaps)
          segmentLengthsRef.current.push(routeData.coords.length - 1);
          // Add elevations for this segment (excluding the first point which overlaps)
          routeElevationsRef.current.push(...routeData.elevations.slice(1));
        } else {
          polylineRef.current = L.polyline(routeData.coords, {
            color: '#3b82f6',
            weight: 4,
            opacity: 0.8,
          }).addTo(map);
          // First segment includes all coordinates
          segmentLengthsRef.current.push(routeData.coords.length);
          // Store all elevations for the first segment
          routeElevationsRef.current = [...routeData.elevations];
        }
      }

      routePointsRef.current.push(point);

      const marker = L.marker([point.lat, point.lng], { 
        draggable: true 
      }).addTo(map);

      marker.on('dragend', async () => {
        const idx = markersRef.current.indexOf(marker);
        if (idx !== -1) {
          const newLatLng = marker.getLatLng();
          const newElevation = await getElevation(newLatLng.lat, newLatLng.lng);
          routePointsRef.current[idx] = {
            ...routePointsRef.current[idx],
            lat: newLatLng.lat,
            lng: newLatLng.lng,
            elevation: newElevation,
          };
          await rebuildRoute();
        }
      });

      markersRef.current.push(marker);

      // Update all marker icons based on their position
      updateMarkerIcons();
      
      calculateDistance();
      
      setIsProcessingClick(false);
    });    const rebuildRoute = async () => {
      if (polylineRef.current) {
        map.removeLayer(polylineRef.current);
        polylineRef.current = null;
      }

      if (routePointsRef.current.length < 2) {
        segmentLengthsRef.current = [];
        routeElevationsRef.current = [];
        return;
      }

      let allCoords: [number, number][] = [];
      let allElevations: number[] = [];
      segmentLengthsRef.current = [];
      
      for (let i = 0; i < routePointsRef.current.length - 1; i++) {
        const start = routePointsRef.current[i];
        const end = routePointsRef.current[i + 1];
        const routeData = await getRouteBetweenPoints(
          [start.lat, start.lng],
          [end.lat, end.lng]
        );
        
        if (i === 0) {
          allCoords = [...routeData.coords];
          allElevations = [...routeData.elevations];
          segmentLengthsRef.current.push(routeData.coords.length);
        } else {
          allCoords = [...allCoords, ...routeData.coords.slice(1)];
          allElevations = [...allElevations, ...routeData.elevations.slice(1)];
          segmentLengthsRef.current.push(routeData.coords.length - 1);
        }
      }

      routeElevationsRef.current = allElevations;

      polylineRef.current = L.polyline(allCoords, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.8,
      }).addTo(map);

      calculateDistance();
    };

    const calculateDistance = () => {
      if (routePointsRef.current.length < 2) {
        onRouteChange?.(routePointsRef.current, 0, [], []);
        return;
      }

      if (!polylineRef.current) {
        onRouteChange?.(routePointsRef.current, 0, [], []);
        return;
      }

      const coords = polylineRef.current.getLatLngs() as L.LatLng[];
      let totalDistance = 0;
      
      // Calculate cumulative distances for each coordinate
      const elevationData: {distance: number, elevation: number}[] = [];
      const fullRoutePoints: RoutePoint[] = [];
      let cumulativeDistance = 0;
      
      coords.forEach((coord, index) => {
        if (index > 0) {
          cumulativeDistance += coords[index - 1].distanceTo(coord);
        }
        elevationData.push({
          distance: cumulativeDistance,
          elevation: routeElevationsRef.current[index] || 0
        });
        fullRoutePoints.push({
          lat: coord.lat,
          lng: coord.lng,
          elevation: routeElevationsRef.current[index] || 0
        });
        if (index < coords.length - 1) {
          totalDistance += coord.distanceTo(coords[index + 1]);
        }
      });

      onRouteChange?.(routePointsRef.current, totalDistance, routeElevationsRef.current, elevationData, fullRoutePoints);
    };

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady) return;

    mapInstanceRef.current.eachLayer((layer: L.Layer) => {
      // Explicitly typed layer
      if (layer instanceof L.TileLayer) {
        mapInstanceRef.current?.removeLayer(layer);
      }
    });

    if (mapType === 'satellite') {
      const satelliteLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles © Esri',
          maxZoom: 19,
        }
      ).addTo(mapInstanceRef.current);

      satelliteLayerRef.current = satelliteLayer;
      roadsOverlayRef.current = null;
    } else if (mapType === 'hybrid') {
      // Use Esri World Imagery with OpenStreetMap overlay
      const satelliteLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles © Esri',
          maxZoom: 19,
        }
      ).addTo(mapInstanceRef.current);

      const roadsOverlay = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        opacity: 0.4,
      }).addTo(mapInstanceRef.current);

      satelliteLayerRef.current = satelliteLayer;
      roadsOverlayRef.current = roadsOverlay;
    } else if (mapType === 'esri-topo') {
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    } else {
      // Default to OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    }
  }, [mapType, isMapReady]);

  // Sync with external routePoints changes (for undo/clear)
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady) return;

    const map = mapInstanceRef.current;

    // If external routePoints is shorter than internal, remove markers and trim route
    if (routePoints.length < routePointsRef.current.length) {
      const pointsToRemove = routePointsRef.current.length - routePoints.length;

      // Remove excess markers
      for (let i = 0; i < pointsToRemove; i++) {
        const marker = markersRef.current.pop();
        if (marker) {
          map.removeLayer(marker);
        }
      }

      // Remove excess segments from polyline
      if (polylineRef.current && segmentLengthsRef.current.length > 0) {
        for (let i = 0; i < pointsToRemove; i++) {
          if (segmentLengthsRef.current.length > 0) {
            const lastSegmentLength = segmentLengthsRef.current.pop()!;
            const currentCoords = polylineRef.current.getLatLngs() as L.LatLng[];
            const newCoords = currentCoords.slice(0, currentCoords.length - lastSegmentLength);
            polylineRef.current.setLatLngs(newCoords);
            // Also remove the corresponding elevations
            routeElevationsRef.current = routeElevationsRef.current.slice(0, routeElevationsRef.current.length - lastSegmentLength);
          }
        }
      }

      // Update internal state
      routePointsRef.current = [...routePoints];

      // Update marker icons
      updateMarkerIcons();

      // Recalculate distance
      if (routePoints.length >= 2 && polylineRef.current) {
        const coords = polylineRef.current.getLatLngs() as L.LatLng[];
        let totalDistance = 0;
        
        // Calculate cumulative distances for each coordinate
        const elevationData: {distance: number, elevation: number}[] = [];
        const fullRoutePoints: RoutePoint[] = [];
        let cumulativeDistance = 0;
        
        coords.forEach((coord, index) => {
          if (index > 0) {
            cumulativeDistance += coords[index - 1].distanceTo(coord);
          }
          elevationData.push({
            distance: cumulativeDistance,
            elevation: routeElevationsRef.current[index] || 0
          });
          fullRoutePoints.push({
            lat: coord.lat,
            lng: coord.lng,
            elevation: routeElevationsRef.current[index] || 0
          });
          if (index < coords.length - 1) {
            totalDistance += coord.distanceTo(coords[index + 1]);
          }
        });
        
        onRouteChange?.(routePointsRef.current, totalDistance, routeElevationsRef.current, elevationData, fullRoutePoints);
      } else {
        onRouteChange?.(routePointsRef.current, 0, [], []);
      }
    } else if (routePoints.length === 0 && routePointsRef.current.length > 0) {
      // Clear all
      markersRef.current.forEach(marker => {
        map.removeLayer(marker);
      });
      markersRef.current = [];
      
      if (polylineRef.current) {
        map.removeLayer(polylineRef.current);
        polylineRef.current = null;
      }
      
      routePointsRef.current = [];
      segmentLengthsRef.current = [];
      routeElevationsRef.current = [];
      onRouteChange?.([], 0, [], []);
    }
  }, [routePoints, isMapReady, onRouteChange]);

  // Handle elevation chart hover position
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady || !polylineRef.current) return;

    const map = mapInstanceRef.current;

    if (hoverPosition !== null && routeElevationsRef.current.length > 0) {
      // TypeScript needs explicit check
      if (typeof hoverPosition !== 'number') return;
      
      // Find the closest coordinate to the hover position
      const coords = polylineRef.current.getLatLngs() as L.LatLng[];
      let closestIndex = 0;
      let minDistance = Math.abs(0 - hoverPosition);

      // Find the coordinate closest to the hover distance
      let cumulativeDistance = 0;
      for (let i = 1; i < coords.length; i++) {
        cumulativeDistance += coords[i - 1].distanceTo(coords[i]);
        const distanceDiff = Math.abs(cumulativeDistance - hoverPosition);
        if (distanceDiff < minDistance) {
          minDistance = distanceDiff;
          closestIndex = i;
        }
      }

      const hoverCoord = coords[closestIndex];

      // Create or update hover marker
      if (hoverMarkerRef.current) {
        hoverMarkerRef.current.setLatLng(hoverCoord);
      } else {
        const hoverIcon = L.divIcon({
          className: 'hover-marker',
          html: '<div style="background-color: #ef4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>',
          iconSize: [12, 12],
          iconAnchor: [6, 6]
        });
        hoverMarkerRef.current = L.marker(hoverCoord, {
          icon: hoverIcon
        }).addTo(map);
      }
    } else {
      // Remove hover marker when not hovering
      if (hoverMarkerRef.current) {
        map.removeLayer(hoverMarkerRef.current);
        hoverMarkerRef.current = null;
      }
    }
  }, [hoverPosition, isMapReady]);

  // Expose map instance to parent
  useImperativeHandle(ref, () => mapInstanceRef.current!);

  return (
    <div 
      ref={mapRef} 
      className={`w-full h-full ${className} relative`}
      style={{ cursor: isProcessingClick ? 'wait' : 'crosshair' }}
      data-testid="map-container"
    >
      {hasShownNetworkWarning && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded-lg shadow-lg text-sm">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <div className="flex flex-col gap-1">
              <span>Network restrictions detected - some routing services may not be available</span>
            </div>
          </div>
        </div>
      )}
      {isProcessingClick && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 px-3 py-1 rounded-lg shadow-lg text-sm font-medium text-gray-700">
          Calculating route...
        </div>
      )}
    </div>
  );
});

MapContainer.displayName = 'MapContainer';

export default MapContainer;
