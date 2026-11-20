import { beforeEach, describe, expect, it } from 'vitest';
import { useCityStore } from '@/store/useCityStore';

describe('TC-I01: useCityStore', () => {
  beforeEach(() => {
    useCityStore.setState({
      timeOfDay: 17.6,
      autoCycleTime: false,
      simSpeed: 1,
      weather: 'clear',
      selectedPoiId: null,
      followedVehicleId: null,
    });
  });

  it('wraps timeOfDay modulo 24, enforces mutual exclusion on selection, and clamps simSpeed', () => {
    const store = useCityStore.getState();

    store.setTimeOfDay(21.5);
    expect(useCityStore.getState().timeOfDay).toBeCloseTo(21.5, 5);

    store.setTimeOfDay(26.5);
    expect(useCityStore.getState().timeOfDay).toBeCloseTo(2.5, 5);

    store.setTimeOfDay(-2);
    expect(useCityStore.getState().timeOfDay).toBeCloseTo(22, 5);

    store.selectPoi('sakura-ramen-corner');
    expect(useCityStore.getState().selectedPoiId).toBe('sakura-ramen-corner');
    expect(useCityStore.getState().followedVehicleId).toBeNull();

    store.followVehicle('vehicle-1');
    expect(useCityStore.getState().followedVehicleId).toBe('vehicle-1');
    expect(useCityStore.getState().selectedPoiId).toBeNull();

    store.selectPoi('bean-steam-cafe');
    expect(useCityStore.getState().selectedPoiId).toBe('bean-steam-cafe');
    expect(useCityStore.getState().followedVehicleId).toBeNull();

    store.setSimSpeed(5);
    expect(useCityStore.getState().simSpeed).toBe(2);

    store.setSimSpeed(-1);
    expect(useCityStore.getState().simSpeed).toBe(0);
  });
});
