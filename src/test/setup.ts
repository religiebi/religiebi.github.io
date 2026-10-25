import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

// Vitest runs without globals, so Testing Library's auto-cleanup must be wired up here.
afterEach(async () => {
  if (typeof document !== 'undefined') {
    const { cleanup } = await import('@testing-library/react');
    cleanup();
  }
});
