import MapContainer from '../MapContainer';

export default function MapContainerExample() {
  return (
    <MapContainer 
      onRouteChange={(points, distance) => {
        console.log('Route updated:', points, 'Distance:', distance);
      }}
    />
  );
}
