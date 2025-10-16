import { ZoomIn, ZoomOut, Locate, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MapControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onLocate?: () => void;
  onFitRoute?: () => void;
}

export default function MapControls({ 
  onZoomIn, 
  onZoomOut, 
  onLocate, 
  onFitRoute 
}: MapControlsProps) {
  return (
    <div className="flex flex-col gap-2" data-testid="container-map-controls">
      <Button
        size="icon"
        variant="secondary"
        className="rounded-full shadow-lg"
        onClick={onZoomIn}
        data-testid="button-zoom-in"
      >
        <ZoomIn className="w-5 h-5" />
      </Button>
      
      <Button
        size="icon"
        variant="secondary"
        className="rounded-full shadow-lg"
        onClick={onZoomOut}
        data-testid="button-zoom-out"
      >
        <ZoomOut className="w-5 h-5" />
      </Button>
      
      <Button
        size="icon"
        variant="secondary"
        className="rounded-full shadow-lg"
        onClick={onLocate}
        data-testid="button-locate"
      >
        <Locate className="w-5 h-5" />
      </Button>
      
      <Button
        size="icon"
        variant="secondary"
        className="rounded-full shadow-lg"
        onClick={onFitRoute}
        data-testid="button-fit-route"
      >
        <Maximize2 className="w-5 h-5" />
      </Button>
    </div>
  );
}
