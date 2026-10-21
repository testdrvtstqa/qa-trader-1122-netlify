/**
 * Ambient type stub for the vendored div100vh-container.
 *
 * The component references this file via a triple-slash `/// <reference />`
 * directive. Upstream DTrader shipped a local override for `react-div-100vh`'s
 * types; it was not carried into the vendored tree, so this minimal stub
 * satisfies the reference and declares the module. TYPE-ONLY: no runtime impact.
 */

declare module 'react-div-100vh' {
    import * as React from 'react';

    export type Div100vhProps = React.HTMLAttributes<HTMLDivElement> & {
        style?: React.CSSProperties;
    };

    const Div100vh: React.FC<React.PropsWithChildren<Div100vhProps>>;

    export default Div100vh;

    export function use100vh(): number | null;
}
