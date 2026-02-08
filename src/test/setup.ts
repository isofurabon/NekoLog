import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
    cleanup();
});

// Mock crypto.randomUUID for consistent test results
vi.stubGlobal('crypto', {
    ...crypto,
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
});
