import MapControls from '../MapControls';

export default function MapControlsExample() {
  return (
    <MapControls 
      onZoomIn={() => console.log('Zoom in')}
      onZoomOut={() => console.log('Zoom out')}
      onLocate={() => console.log('Locate')}
      onFitRoute={() => console.log('Fit route')}
    />
  );
}
