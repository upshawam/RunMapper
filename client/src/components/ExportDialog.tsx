import { Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface RoutePoint {
  lat: number;
  lng: number;
  elevation?: number;
}

interface ExportDialogProps {
  routePoints: RoutePoint[];
  disabled?: boolean;
}

export default function ExportDialog({ routePoints, disabled }: ExportDialogProps) {
  const generateGPX = () => {
    const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Route Planner">
  <trk>
    <name>My Running Route</name>
    <trkseg>`;

    const gpxPoints = routePoints
      .map(
        (point) =>
          `      <trkpt lat="${point.lat}" lon="${point.lng}">
        <ele>${point.elevation || 0}</ele>
      </trkpt>`
      )
      .join('\n');

    const gpxFooter = `
    </trkseg>
  </trk>
</gpx>`;

    return gpxHeader + '\n' + gpxPoints + gpxFooter;
  };

  const downloadGPX = () => {
    const gpxContent = generateGPX();
    const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `route-${Date.now()}.gpx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="secondary" 
          className="gap-2 shadow-lg"
          disabled={disabled || routePoints.length < 2}
          data-testid="button-export"
        >
          <Share2 className="w-4 h-4" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent data-testid="dialog-export">
        <DialogHeader>
          <DialogTitle>Export Route</DialogTitle>
          <DialogDescription>
            Download your route as a GPX file for use with GPS devices and fitness apps.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <Button 
            className="w-full gap-2" 
            onClick={downloadGPX}
            data-testid="button-download-gpx"
          >
            <Download className="w-4 h-4" />
            Download GPX File
          </Button>
          
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">Your route contains {routePoints.length} points.</p>
            <p>GPX files can be imported into apps like Strava, Garmin Connect, and more.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
