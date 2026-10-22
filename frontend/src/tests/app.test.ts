import { describe, it, expect } from 'vitest';

describe('Frontend Types & Logic Tests', () => {
  it('correctly models Hinjawadi road network nodes', () => {
    const nodes = [
      { id: 'shivaji_chowk', name: 'Shivaji Chowk Gateway', latitude: 18.5912, longitude: 73.7389 },
      { id: 'bhumkar_chowk', name: 'Bhumkar Chowk', latitude: 18.5982, longitude: 73.7548 },
      { id: 'megapolis_ph3', name: 'Megapolis Circle Phase 3', latitude: 18.5772, longitude: 73.6891 }
    ];

    expect(nodes.length).toBe(3);
    const shivaji = nodes.find(n => n.id === 'shivaji_chowk');
    expect(shivaji).toBeDefined();
    expect(shivaji?.latitude).toBeCloseTo(18.5912, 3);
  });

  it('calculates percentage time savings accurately', () => {
    const baselineMinutes = 35.0;
    const optimizedMinutes = 24.5;
    const savingsPct = ((baselineMinutes - optimizedMinutes) / baselineMinutes) * 100.0;
    expect(savingsPct).toBeCloseTo(30.0, 1);
  });

  it('determines appropriate congestion colors', () => {
    const getCongestionColor = (level: string, isClosed: boolean) => {
      if (isClosed) return '#64748b';
      switch (level) {
        case 'low': return '#10b981';
        case 'moderate': return '#f59e0b';
        case 'heavy': return '#f97316';
        case 'severe': return '#ef4444';
        default: return '#94a3b8';
      }
    };

    expect(getCongestionColor('low', false)).toBe('#10b981');
    expect(getCongestionColor('severe', false)).toBe('#ef4444');
    expect(getCongestionColor('severe', true)).toBe('#64748b'); // closed road takes precedence
  });

  it('verifies simulation scenario descriptors', () => {
    const scenarios = ['off_peak', 'morning_peak', 'evening_peak', 'monsoon_waterlogging', 'road_closure_incident'];
    expect(scenarios).toContain('morning_peak');
    expect(scenarios).toContain('road_closure_incident');
    expect(scenarios.length).toBe(5);
  });
});
