import { CityCanvas } from '@/scene/CityCanvas';
import { defaultWorldEngine } from '@/sim/worldEngine';
import { HudOverlay } from '@/ui/HudOverlay';
import { LoadingScreen } from '@/ui/LoadingScreen';

export function App() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#1a1826]">
      <CityCanvas engine={defaultWorldEngine} />
      <HudOverlay engine={defaultWorldEngine} />
      <LoadingScreen />
    </main>
  );
}

export default App;
