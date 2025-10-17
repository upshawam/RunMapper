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

  // ✅ Direct call to ORS with fallback
  const getRouteBetweenPoints = async (
    start: [number, number],
    end: [number, number]
  ): Promise<[number, number][]> => {
    try {
      const response = await fetch(
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
            ]
          })
        }
      );

      if (!response.ok) {
        console.warn("Routing API failed:", await response.text());
        return [start, end]; // fallback: straight line
      }

      const data = await response.json();
      const coords = data.features?.[0]?.geometry?.coordinates;

      if (!coords) {
        console.warn("Invalid routing response format", data);
        return [start, end]; // fallback
      }

      return coords.map((c: number[]) => [c[1], c[0]] as [number, number]);
    } catch (err) {
      console.error("Routing error:", err);
      return [start, end]; // fallback
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

    // ✅ CLICK HANDLER
    map.on('click', async (e: L.LeafletMouseEvent) => {
      const point: RoutePoint = {
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        elevation: Math.floor(Math.random() * 200) + 50,
      };

      // Always push the point and drop a marker
      routePointsRef.current.push(point);
      const marker = L.marker([point.lat, point.lng]).addTo(map);
      markersRef.current.push(marker);

      // If there’s a previous point, draw a snapped (or fallback) line
      if (routePointsRef.current.length > 1) {
        const lastPoint = routePointsRef.current[routePointsRef.current.length - 2];
        const routeCoords = await getRouteBetweenPoints(
          [lastPoint.lat, lastPoint.lng],
          [point.lat, point.lng]
        );

        if (polylineRef.current) {
          const existingCoords = polylineRef.current.getLatLngs() as L.LatLng[];
          const newCoords = [
            ...existingCoords,
            ...routeCoords.slice(1).map(c => L.latLng(c[0], c[1]))
          ];
          polylineRef.current.setLatLngs(newCoords);
        } else {
          polylineRef.current = L.polyline(routeCoords, {
            color: '#3b82f6',
            weight: 4,
            opacity: 0.8,
          }).addTo(map);
        }
      }

      calculateDistance();
    });

    const calculateDistance = () => {
      if (routePointsRef.current.length < 2 || !polylineRef.current) {
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
