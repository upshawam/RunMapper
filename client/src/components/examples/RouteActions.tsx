import RouteActions from '../RouteActions';

export default function RouteActionsExample() {
  return (
    <RouteActions 
      onUndo={() => console.log('Undo')}
      onClear={() => console.log('Clear')}
      canUndo={true}
    />
  );
}
