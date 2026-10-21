import '@testing-library/jest-dom/jest-globals';
import '@testing-library/jest-dom';
import { applyReact19DomPolyfills } from '@/utils/react19-dom-polyfills';

applyReact19DomPolyfills();

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
    })),
});

// Mock fetch for tests
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
    })
) as jest.Mock;
