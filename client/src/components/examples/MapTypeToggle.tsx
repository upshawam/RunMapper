import MapTypeToggle, { MapType } from '../MapTypeToggle';
import { useState } from 'react';

export default function MapTypeToggleExample() {
  const [mapType, setMapType] = useState<MapType>('map');
  
  return (
    <MapTypeToggle 
      mapType={mapType}
      onToggle={setMapType}
    />
  );
}
