/**
 * React 19 / @types/react 19 compatibility for vendored trader code.
 * Restores the zero-arg useRef overload removed in @types/react 19.
 */
import 'react';

declare module 'react' {
    function useRef<T = unknown>(): MutableRefObject<T | undefined>;
}

export {};
