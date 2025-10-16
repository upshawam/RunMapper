import MapTypeToggle from '../MapTypeToggle';
import { useState } from 'react';

export default function MapTypeToggleExample() {
  const [mapType, setMapType] = useState<'map' | 'satellite'>('map');
  
  return (
    <MapTypeToggle 
      mapType={mapType}
      onToggle={setMapType}
    />
  );
}
