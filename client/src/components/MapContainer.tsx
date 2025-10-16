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
  const [isMapReady, setIsMapReady] = useState(false);

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

    if (mapType === 'satellite') {
      satelliteLayer.addTo(map);
    } else {
      mapLayer.addTo(map);
    }

    mapInstanceRef.current = map;
    setIsMapReady(true);

    const greenIcon = L.icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iOCIgZmlsbD0iIzIyYzU1ZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+CjwvY3ZnPg==',
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

    map.on('click', (e: L.LeafletMouseEvent) => {
      const point: RoutePoint = {
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        elevation: Math.floor(Math.random() * 200) + 50,
      };

      routePointsRef.current.push(point);

      const isFirst = routePointsRef.current.length === 1;
      const isLast = routePointsRef.current.length > 1;
      const iconToUse = isFirst ? greenIcon : isLast && routePointsRef.current.length > 1 ? redIcon : blueIcon;

      const marker = L.marker([point.lat, point.lng], { 
        icon: iconToUse,
        draggable: true 
      }).addTo(map);

      marker.on('drag', (dragEvent) => {
        const idx = markersRef.current.indexOf(marker);
        if (idx !== -1) {
          const newLatLng = dragEvent.target.getLatLng();
          routePointsRef.current[idx] = {
            ...routePointsRef.current[idx],
            lat: newLatLng.lat,
            lng: newLatLng.lng,
          };
          updatePolyline();
          calculateDistance();
        }
      });

      if (markersRef.current.length > 0) {
        const lastMarker = markersRef.current[markersRef.current.length - 1];
        lastMarker.setIcon(blueIcon);
      }

      markersRef.current.push(marker);
      updatePolyline();
      calculateDistance();
    });

    const updatePolyline = () => {
      if (polylineRef.current) {
        polylineRef.current.setLatLngs(
          routePointsRef.current.map(p => [p.lat, p.lng])
        );
      } else if (routePointsRef.current.length > 1) {
        polylineRef.current = L.polyline(
          routePointsRef.current.map(p => [p.lat, p.lng]),
          {
            color: '#3b82f6',
            weight: 4,
            opacity: 0.8,
          }
        ).addTo(map);
      }
    };

    const calculateDistance = () => {
      if (routePointsRef.current.length < 2) {
        onRouteChange?.(routePointsRef.current, 0);
        return;
      }

      let totalDistance = 0;
      for (let i = 0; i < routePointsRef.current.length - 1; i++) {
        const p1 = L.latLng(routePointsRef.current[i].lat, routePointsRef.current[i].lng);
        const p2 = L.latLng(routePointsRef.current[i + 1].lat, routePointsRef.current[i + 1].lng);
        totalDistance += p1.distanceTo(p2);
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
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles © Esri',
          maxZoom: 19,
        }
      ).addTo(mapInstanceRef.current);
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
