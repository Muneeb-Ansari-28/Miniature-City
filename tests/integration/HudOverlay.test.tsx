import { beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { WorldEngine } from '@/sim/worldEngine';
import { useCityStore } from '@/store/useCityStore';
import { HudOverlay } from '@/ui/HudOverlay';

describe('TC-I03: HudOverlay integration', () => {
  beforeEach(() => {
    useCityStore.setState({
      timeOfDay: 12.5,
      autoCycleTime: false,
      simSpeed: 1,
      weather: 'clear',
      selectedPoiId: null,
      followedVehicleId: null,
    });
  });

  it('updates store on Night/Rain clicks, Space/Esc shortcuts, and renders InspectorCard for selected POI', () => {
    const engine = new WorldEngine({ seed: 42 });
    render(<HudOverlay engine={engine} />);

    // Click "Night" preset
    const nightBtn = screen.getByRole('button', { name: 'Night' });
    fireEvent.click(nightBtn);
    expect(useCityStore.getState().timeOfDay).toBeGreaterThanOrEqual(20);
    expect(nightBtn).toHaveAttribute('aria-pressed', 'true');

    // Click "Rain" weather toggle
    const rainBtn = screen.getByRole('button', { name: /Rain/i });
    fireEvent.click(rainBtn);
    expect(useCityStore.getState().weather).toBe('rain');
    expect(rainBtn).toHaveAttribute('aria-pressed', 'true');

    // Press Space to pause simulation
    fireEvent.keyDown(window, { code: 'Space' });
    expect(useCityStore.getState().simSpeed).toBe(0);

    // Select a restaurant POI and verify InspectorCard renders name and occupancy
    const ramenPoi = engine.city.pois.find((p) => p.id === 'sakura-ramen-corner')!;
    act(() => {
      useCityStore.getState().selectPoi(ramenPoi.id);
    });

    expect(screen.getByTestId('inspector-card')).toBeInTheDocument();
    expect(screen.getByText(ramenPoi.name)).toBeInTheDocument();
    expect(screen.getByTestId('poi-occupancy')).toHaveTextContent(
      `${ramenPoi.occupantIds.length} / ${ramenPoi.capacity}`,
    );

    // Press Escape to dismiss InspectorCard
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(useCityStore.getState().selectedPoiId).toBeNull();
    expect(screen.queryByTestId('inspector-card')).not.toBeInTheDocument();
  });
});
