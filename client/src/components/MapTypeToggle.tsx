import { Layers } from 'lucide-react';

export type MapType = 
  | 'map' 
  | 'satellite' 
  | 'hybrid'
  | 'esri-topo'
  | 'terrain'
  | 'outdoors'
  | 'cyclosm';

interface MapTypeToggleProps {
  mapType: MapType;
  onToggle: (type: MapType) => void;
}

export default function MapTypeToggle({ mapType, onToggle }: MapTypeToggleProps) {
  const mapTypeLabels: Record<MapType, string> = {
    'map': 'OpenStreetMap',
    'satellite': 'Satellite',
    'hybrid': 'Satellite + Roads',
    'esri-topo': 'Esri Topographic',
    'terrain': 'Terrain (Stamen)',
    'outdoors': 'Outdoors (Thunderforest)',
    'cyclosm': 'CyclOSM'
  };

  return (
    <div className="flex items-center gap-2 p-1 rounded-lg bg-white shadow-lg border-2">
      <Layers className="w-4 h-4 ml-2 text-gray-600" />
      <select 
        value={mapType} 
        onChange={(e) => onToggle(e.target.value as MapType)}
        className="w-48 border-0 shadow-none focus:ring-0 bg-transparent text-sm"
      >
        {Object.entries(mapTypeLabels).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
    </div>
  );
}
