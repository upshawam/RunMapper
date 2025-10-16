import ElevationChart from '../ElevationChart';

export default function ElevationChartExample() {
  const mockData = [
    { distance: 0, elevation: 50 },
    { distance: 500, elevation: 75 },
    { distance: 1000, elevation: 120 },
    { distance: 1500, elevation: 95 },
    { distance: 2000, elevation: 150 },
    { distance: 2500, elevation: 180 },
    { distance: 3000, elevation: 160 },
    { distance: 3500, elevation: 130 },
    { distance: 4000, elevation: 100 },
  ];
  
  return <ElevationChart data={mockData} unit="mi" />;
}
