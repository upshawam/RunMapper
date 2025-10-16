import { Undo, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RouteActionsProps {
  onUndo?: () => void;
  onClear?: () => void;
  canUndo?: boolean;
}

export default function RouteActions({ onUndo, onClear, canUndo = false }: RouteActionsProps) {
  return (
    <div className="flex gap-2" data-testid="container-route-actions">
      <Button
        size="sm"
        variant="secondary"
        className="gap-2"
        onClick={onUndo}
        disabled={!canUndo}
        data-testid="button-undo"
      >
        <Undo className="w-4 h-4" />
        Undo
      </Button>
      
      <Button
        size="sm"
        variant="secondary"
        className="gap-2"
        onClick={onClear}
        disabled={!canUndo}
        data-testid="button-clear"
      >
        <Trash2 className="w-4 h-4" />
        Clear
      </Button>
    </div>
  );
}
