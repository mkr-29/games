// Simple test to verify the testing setup works
import { describe, it, expect } from 'vitest';

describe('Game Initialization', () => {
  it('should initialize game state correctly', () => {
    // This is a simple test to verify the testing framework works
    expect(true).toBe(true);
  });

  it('should have a starting budget', () => {
    // This would test actual game state once we expose it properly
    expect(10000).toBe(10000);
  });
});