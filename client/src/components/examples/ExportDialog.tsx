import ExportDialog from '../ExportDialog';

export default function ExportDialogExample() {
  const mockRoute = [
    { lat: 40.7128, lng: -74.0060, elevation: 50 },
    { lat: 40.7138, lng: -74.0070, elevation: 75 },
    { lat: 40.7148, lng: -74.0080, elevation: 120 },
  ];
  
  return <ExportDialog routePoints={mockRoute} />;
}
