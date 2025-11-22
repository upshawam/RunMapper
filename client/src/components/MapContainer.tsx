import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
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
  routePoints?: RoutePoint[];
}

const MapContainer = forwardRef<L.Map | null, MapContainerProps>(({ onRouteChange, mapType = 'map', className = '', routePoints = [] }, ref) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routePointsRef = useRef<RoutePoint[]>([]);
  const markersRef = useRef<L.Marker[]>([]);
  const polylineRef = useRef<L.Polyline | null>(null);
  const satelliteLayerRef = useRef<L.TileLayer | null>(null);
  const roadsOverlayRef = useRef<L.TileLayer | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

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

  // ✅ Updated to call ORS directly with your API key
  const getRouteBetweenPoints = async (start: [number, number], end: [number, number]): Promise<[number, number][]> => {
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
            ],
            elevation: true,
            format: "geojson"
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('Routing API failed:', errorText);
        return [start, end];
      }

      const data = await response.json();
      const coords = data.features?.[0]?.geometry?.coordinates;
      if (!coords) {
        console.warn('Invalid routing response format');
        return [start, end];
      }

      return coords.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
    } catch (error) {
      console.error('Routing error:', error instanceof Error ? error.message : String(error));
      return [start, end];
    }
  };

  const getElevation = async (lat: number, lng: number): Promise<number> => {
    try {
      const response = await fetch(
        `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`
      );
      
      if (!response.ok) {
        console.warn('Elevation API failed, using default elevation');
        return 100; // Default elevation
      }

      const data = await response.json();
      const elevation = data.results?.[0]?.elevation;
      return elevation || 100;
    } catch (error) {
      console.error('Elevation error:', error);
      return 100; // Default elevation
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

    // ✅ Custom icons preserved
    const greenIcon = L.icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iOCIgZmlsbD0iIzIyYzU1ZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPg==',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const blueIcon = L.icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1zbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iOCIgZmlsbD0iIzM4OTVmZiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPg==',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const redIcon = L.icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1zbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iOCIgZmlsbD0iI2VmNDQ0NCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPg==',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    map.on('click', async (e: L.LeafletMouseEvent) => {
      console.log('Map clicked at:', e.latlng);
      
      // Get elevation for the clicked point
      const elevation = await getElevation(e.latlng.lat, e.latlng.lng);
      
      const point: RoutePoint = {
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        elevation: elevation,
      };

      console.log('New point:', point);
      const isFirst = routePointsRef.current.length === 0;
      console.log('Is first point:', isFirst);

      if (!isFirst) {
        const lastPoint = routePointsRef.current[routePointsRef.current.length - 1];
        console.log('Last point:', lastPoint);
        const routeCoords = await getRouteBetweenPoints(
          [lastPoint.lat, lastPoint.lng],
          [point.lat, point.lng]
        );

        console.log('Route coordinates:', routeCoords);

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
      console.log('Updated route points:', routePointsRef.current);

      const marker = L.marker([point.lat, point.lng], { 
        draggable: true 
      }).addTo(map);

      console.log('Marker added:', marker);

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
          console.log('Marker dragged to:', newLatLng);
          await rebuildRoute();
        }
      });

      markersRef.current.push(marker);
      console.log('Updated markers:', markersRef.current);
      
      // Update all marker icons based on their position
      updateMarkerIcons();
      
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

  // Sync with external routePoints changes (for undo/clear)
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady) return;

    const map = mapInstanceRef.current;

    // If external routePoints is shorter than internal, remove markers and rebuild
    if (routePoints.length < routePointsRef.current.length) {
      // Remove excess markers
      while (markersRef.current.length > routePoints.length) {
        const marker = markersRef.current.pop();
        if (marker) {
          map.removeLayer(marker);
        }
      }

      // Update internal state
      routePointsRef.current = [...routePoints];

      // Rebuild polyline
      if (polylineRef.current) {
        map.removeLayer(polylineRef.current);
        polylineRef.current = null;
      }

      if (routePoints.length >= 2) {
        (async () => {
          let allCoords: [number, number][] = [];
          
          for (let i = 0; i < routePoints.length - 1; i++) {
            const start = routePoints[i];
            const end = routePoints[i + 1];
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

          // Update marker icons
          markersRef.current.forEach((marker, idx) => {
            if (idx === 0) {
              marker.setIcon(greenIcon);
            } else if (idx === routePoints.length - 1) {
              marker.setIcon(redIcon);
            } else {
              marker.setIcon(blueIcon);
            }
          });

          // Recalculate distance
          if (polylineRef.current) {
            const coords = polylineRef.current.getLatLngs() as L.LatLng[];
            let totalDistance = 0;
            
            for (let i = 0; i < coords.length - 1; i++) {
              totalDistance += coords[i].distanceTo(coords[i + 1]);
            }

            onRouteChange?.(routePointsRef.current, totalDistance);
          }
        })();
      } else if (routePoints.length === 0) {
        onRouteChange?.([], 0);
      } else {
        onRouteChange?.(routePointsRef.current, 0);
      }
    }

    // Define icons for the effect
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
  }, [routePoints, isMapReady, onRouteChange]);

  // Expose map instance to parent
  useImperativeHandle(ref, () => mapInstanceRef.current!);

  return (
    <div 
      ref={mapRef} 
      className={`w-full h-full ${className}`}
      data-testid="map-container"
    />
  );
});

MapContainer.displayName = 'MapContainer';

export default MapContainer;
