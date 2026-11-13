import { describe, expect, it } from 'vitest';
import { GROWTH_STAGES, growthFor } from '../src/lib/growth';

describe('sunflower growth', () => {
  it('starts as a seed and points at the first sprout', () => {
    const growth = growthFor(0);
    expect(growth.stage.name).toBe('种子');
    expect(growth.next?.name).toBe('发芽');
    expect(growth.toNext).toBe(30);
    expect(growth.progress).toBe(0);
  });

  it('moves through a stage boundary exactly at its threshold', () => {
    expect(growthFor(29).stage.name).toBe('种子');
    expect(growthFor(30).stage.name).toBe('发芽');
    expect(growthFor(249).stage.name).toBe('发芽');
    expect(growthFor(250).stage.name).toBe('幼苗');
  });

  it('reports progress inside the current stage only', () => {
    // 幼苗 spans 250–750; 500 is halfway through.
    const growth = growthFor(500);
    expect(growth.stage.name).toBe('幼苗');
    expect(growth.next?.name).toBe('花苞');
    expect(growth.toNext).toBe(250);
    expect(growth.progress).toBeCloseTo(0.5);
  });

  it('keeps the final seed stage for a full 600-word journey', () => {
    expect(growthFor(5999).stage.name).toBe('盛放');
    expect(growthFor(6000).stage.name).toBe('结籽');
  });

  it('keeps a finished garden at full bloom', () => {
    const growth = growthFor(6600);
    expect(growth.stage.name).toBe('结籽');
    expect(growth.next).toBeNull();
    expect(growth.toNext).toBe(0);
    expect(growth.progress).toBe(1);
  });

  it('never regresses on invalid or negative input', () => {
    expect(growthFor(-10).stage.name).toBe('种子');
    expect(growthFor(Number.NaN).stage.name).toBe('种子');
    expect(growthFor(Number.POSITIVE_INFINITY).stage.name).toBe('种子');
  });

  it('has strictly increasing thresholds', () => {
    for (let i = 1; i < GROWTH_STAGES.length; i += 1) {
      expect(GROWTH_STAGES[i].min).toBeGreaterThan(GROWTH_STAGES[i - 1].min);
    }
  });
});
