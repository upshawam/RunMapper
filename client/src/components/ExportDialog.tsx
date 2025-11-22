import { Download, Share2 } from 'lucide-react';
import React from 'react';
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
  const [isOpen, setIsOpen] = React.useState(false);
  
  const generateGPX = () => {
    const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="RunMapper" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <trk>
    <name>My Running Route</name>
    <trkseg>`;

    const gpxPoints = routePoints
      .map(
        (point) =>
          `      <trkpt lat="${point.lat}" lon="${point.lng}">
        <ele>${(point.elevation || 0).toFixed(1)}</ele>
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

  // Temporary: Test with simple div instead of Dialog
  if (isOpen) {
    return (
      <div className="fixed inset-0 z-[2000] bg-black/50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
          <h2 className="text-lg font-semibold mb-4">Export Route</h2>
          <p className="text-sm text-gray-600 mb-4">
            Download your route as a GPX file for use with GPS devices and fitness apps.
          </p>
          <div className="space-y-4">
            <Button 
              className="w-full gap-2" 
              onClick={downloadGPX}
              data-testid="button-download-gpx"
            >
              <Download className="w-4 h-4" />
              Download GPX File
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Button 
      variant="secondary" 
      className="gap-2 shadow-lg"
      disabled={disabled || routePoints.length < 2}
      data-testid="button-export"
      onClick={() => {
        setIsOpen(true);
      }}
    >
      <Share2 className="w-4 h-4" />
      Export
    </Button>
  );
}
