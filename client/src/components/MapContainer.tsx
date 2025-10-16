import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RoutePoint {
  lat: number;
  lng: number;
  elevation?: number;
}

interface MapContainerProps {
  onRouteChange?: (points: RoutePoint[], distance: number) => void;
  mapType?: 'map' | 'satellite';
  className?: string;
}

export default function MapContainer({ onRouteChange, mapType = 'map', className = '' }: MapContainerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routePointsRef = useRef<RoutePoint[]>([]);
  const markersRef = useRef<L.Marker[]>([]);
  const polylineRef = useRef<L.Polyline | null>(null);
  const satelliteLayerRef = useRef<L.TileLayer | null>(null);
  const roadsOverlayRef = useRef<L.TileLayer | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const getRouteBetweenPoints = async (start: [number, number], end: [number, number]): Promise<[number, number][]> => {
    try {
      const response = await fetch('/api/route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start,
          end
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('Routing API failed:', errorText);
        return [start, end];
      }

      const data = await response.json();
      
      if (!data.features || !data.features[0] || !data.features[0].geometry) {
        console.warn('Invalid routing response format');
        return [start, end];
      }
      
      const coordinates = data.features[0].geometry.coordinates;
      
      return coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
    } catch (error) {
      console.error('Routing error:', error instanceof Error ? error.message : String(error));
      return [start, end];
    }
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
      roadsOverlay.addTo(map);
    } else {
      mapLayer.addTo(map);
    }

    mapInstanceRef.current = map;
    setIsMapReady(true);

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

    map.on('click', async (e: L.LeafletMouseEvent) => {
      const point: RoutePoint = {
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        elevation: Math.floor(Math.random() * 200) + 50,
      };

      const isFirst = routePointsRef.current.length === 0;
      
      if (!isFirst) {
        const lastPoint = routePointsRef.current[routePointsRef.current.length - 1];
        const routeCoords = await getRouteBetweenPoints(
          [lastPoint.lat, lastPoint.lng],
          [point.lat, point.lng]
        );

        if (polylineRef.current) {
          const existingCoords = polylineRef.current.getLatLngs() as L.LatLng[];
          const newCoords = [...existingCoords, ...routeCoords.slice(1).map(coord => L.latLng(coord[0], coord[1]))];
          polylineRef.current.setLatLngs(newCoords);
        } else {
          polylineRef.current = L.polyline(routeCoords, {
            color: '#3b82f6',
            weight: 4,
            opacity: 0.8,
          }).addTo(map);
        }
      }

      routePointsRef.current.push(point);

      const isLast = routePointsRef.current.length > 1;
      const iconToUse = isFirst ? greenIcon : isLast ? redIcon : blueIcon;

      const marker = L.marker([point.lat, point.lng], { 
        icon: iconToUse,
        draggable: true 
      }).addTo(map);

      marker.on('dragend', async () => {
        const idx = markersRef.current.indexOf(marker);
        if (idx !== -1) {
          const newLatLng = marker.getLatLng();
          routePointsRef.current[idx] = {
            ...routePointsRef.current[idx],
            lat: newLatLng.lat,
            lng: newLatLng.lng,
          };
          await rebuildRoute();
        }
      });

      if (markersRef.current.length > 0) {
        const lastMarker = markersRef.current[markersRef.current.length - 1];
        if (markersRef.current.length > 1) {
          lastMarker.setIcon(blueIcon);
        }
      }

      markersRef.current.push(marker);
      calculateDistance();
    });

    const rebuildRoute = async () => {
      if (polylineRef.current) {
        map.removeLayer(polylineRef.current);
        polylineRef.current = null;
      }

      if (routePointsRef.current.length < 2) return;

      let allCoords: [number, number][] = [];
      
      for (let i = 0; i < routePointsRef.current.length - 1; i++) {
        const start = routePointsRef.current[i];
        const end = routePointsRef.current[i + 1];
        const routeCoords = await getRouteBetweenPoints(
          [start.lat, start.lng],
          [end.lat, end.lng]
        );
        
        if (i === 0) {
          allCoords = [...routeCoords];
        } else {
          allCoords = [...allCoords, ...routeCoords.slice(1)];
        }
      }

      polylineRef.current = L.polyline(allCoords, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.8,
      }).addTo(map);

      calculateDistance();
    };

    const calculateDistance = () => {
      if (routePointsRef.current.length < 2) {
        onRouteChange?.(routePointsRef.current, 0);
        return;
      }

      if (!polylineRef.current) {
        onRouteChange?.(routePointsRef.current, 0);
        return;
      }

      const coords = polylineRef.current.getLatLngs() as L.LatLng[];
      let totalDistance = 0;
      
      for (let i = 0; i < coords.length - 1; i++) {
        totalDistance += coords[i].distanceTo(coords[i + 1]);
      }

      onRouteChange?.(routePointsRef.current, totalDistance);
    };

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady) return;

    mapInstanceRef.current.eachLayer((layer) => {
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

      const roadsOverlay = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        opacity: 0.5,
      }).addTo(mapInstanceRef.current);

      satelliteLayerRef.current = satelliteLayer;
      roadsOverlayRef.current = roadsOverlay;
    } else {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    }
  }, [mapType, isMapReady]);

  return (
    <div 
      ref={mapRef} 
      className={`w-full h-full ${className}`}
      data-testid="map-container"
    />
  );
}
