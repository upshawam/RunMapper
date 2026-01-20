import { Pen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface FreehandToggleProps {
  isFreehand: boolean;
  onToggle: (freehand: boolean) => void;
}

export default function FreehandToggle({ isFreehand, onToggle }: FreehandToggleProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="sm"
          className={`gap-2 shadow-lg border-2 ${
            isFreehand
              ? 'bg-blue-500 hover:bg-blue-600 text-white border-blue-600'
              : 'bg-white hover:bg-gray-50 border-gray-300'
          }`}
          onClick={() => onToggle(!isFreehand)}
          data-testid="button-freehand-toggle"
        >
          <Pen className="w-4 h-4" />
          {isFreehand ? 'Freehand On' : 'Freehand Off'}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{isFreehand ? 'Click to snap to routes' : 'Click to draw freehand'}</p>
      </TooltipContent>
    </Tooltip>
  );
}
