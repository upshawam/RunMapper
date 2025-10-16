import RouteStats from '../RouteStats';
import { useState } from 'react';

export default function RouteStatsExample() {
  const [unit, setUnit] = useState<'mi' | 'km'>('mi');
  
  return (
    <RouteStats 
      distance={8046.72}
      unit={unit}
      elevationGain={150}
      elevationLoss={120}
      onUnitToggle={() => setUnit(unit === 'mi' ? 'km' : 'mi')}
    />
  );
}
