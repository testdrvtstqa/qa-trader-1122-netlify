/**
 * Ambient module declarations for the vendored DTrader packages.
 *
 * DTrader imports SVGs as React components via @svgr, and various static
 * assets as URL strings. esbuild (the rsbuild transpiler) handles these at
 * build time, but `tsc --noEmit` needs ambient declarations so the imports
 * resolve during type-checking. These are TYPE-ONLY and do not affect runtime.
 */

/**
 * The installed `@deriv-com/utils` ships an empty `index.d.ts` (`export {}`),
 * so the namespace-style helper exports the vendored DTrader code relies on are
 * invisible to `tsc`. Augment the module with loosely-typed declarations for the
 * members actually referenced. TYPE-ONLY: no runtime impact.
 */
declare module '@deriv-com/utils' {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export const AppIDConstants: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export const URLConstants: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export const ObjectUtils: any;
    export const PromiseUtils: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createPromise: <T = any>() => { promise: Promise<T>; resolve: (value: T) => void; reject: (reason?: any) => void };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export const FormatUtils: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export const CountryUtils: any;
}

/**
 * Global utility types that upstream DTrader declared ambiently (via
 * `@deriv/stores` global.d.ts). Re-declared here so the vendored code that
 * references them unqualified resolves under `tsc`. TYPE-ONLY.
 */
type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
    {
        [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
    }[Keys];

type DeepRequired<T> = T extends object
    ? {
          [P in keyof T]-?: DeepRequired<NonNullable<T[P]>>;
      }
    : T;

/**
 * Global `window` properties injected by third-party scripts / native bridges
 * that the vendored DTrader code reads. Loosely typed — TYPE-ONLY.
 */
interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Intercom?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    DerivInterCom?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    DerivAppChannel?: any;
}

declare module '*.svg' {
    import * as React from 'react';

    export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }>;

    /**
     * The vendored DTrader SVGR config emits the React component as the default
     * export (and it is also used as a URL string in a few `<img src>` spots).
     * Type it as a permissive React component so JSX usage with arbitrary props
     * (`width`/`height`/`className`) type-checks; string usages still resolve.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const src: React.FC<any> & string;
    export default src;
}

declare module '*.png' {
    const content: string;
    export default content;
}

declare module '*.jpg' {
    const content: string;
    export default content;
}

declare module '*.jpeg' {
    const content: string;
    export default content;
}

declare module '*.gif' {
    const content: string;
    export default content;
}

declare module '*.webp' {
    const content: string;
    export default content;
}

declare module '*.woff' {
    const content: string;
    export default content;
}

declare module '*.woff2' {
    const content: string;
    export default content;
}

declare module '*.ttf' {
    const content: string;
    export default content;
}

declare module '*.eot' {
    const content: string;
    export default content;
}

declare module '*.xml' {
    const content: string;
    export default content;
}

/**
 * dotLottie animations for the trade-type guide. Registered as an rsbuild
 * asset/resource in rsbuild.config.ts, so the import resolves to a URL string.
 */
declare module '*.lottie' {
    const content: string;
    export default content;
}

declare module '*.css' {
    const content: { [className: string]: string };
    export default content;
}

declare module '*.scss' {
    const content: { [className: string]: string };
    export default content;
}
