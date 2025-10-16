import { Map, Satellite } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MapTypeToggleProps {
  mapType: 'map' | 'satellite';
  onToggle: (type: 'map' | 'satellite') => void;
}

export default function MapTypeToggle({ mapType, onToggle }: MapTypeToggleProps) {
  return (
    <div className="flex gap-1 p-1 rounded-lg bg-card/95 backdrop-blur-lg shadow-lg" data-testid="container-map-type-toggle">
      <Button
        size="sm"
        variant={mapType === 'map' ? 'default' : 'ghost'}
        className="gap-2"
        onClick={() => onToggle('map')}
        data-testid="button-map-view"
      >
        <Map className="w-4 h-4" />
        Map
      </Button>
      
      <Button
        size="sm"
        variant={mapType === 'satellite' ? 'default' : 'ghost'}
        className="gap-2"
        onClick={() => onToggle('satellite')}
        data-testid="button-satellite-view"
      >
        <Satellite className="w-4 h-4" />
        Satellite
      </Button>
    </div>
  );
}
