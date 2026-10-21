/**
 * react-router v5 type shim (scoped to this template).
 *
 * WHY: The runtime dependency pinned for the vendored DTrader code is
 * react-router / react-router-dom v5.3.4 (see local node_modules), whose v5
 * API (Redirect, Switch, withRouter, RouteComponentProps, useHistory,
 * RouteProps.exact, matchPath, ...) is what the vendor code is written
 * against. However tsc hoists the monorepo-root react-router-dom v6 *types*,
 * which drop all of those.
 *
 * These are AMBIENT `declare module` declarations, picked up automatically
 * because this file is inside tsconfig's "include". Do NOT map
 * react-router/react-router-dom to this file via tsconfig "paths": rsbuild
 * honors tsconfig paths at BUNDLE time too, so such a mapping makes the
 * runtime import resolve to this types-only file — an empty module — and the
 * app crashes with "(0, F.withRouter) is not a function".
 */

declare module 'react-router' {
    import * as React from 'react';
    import { History, Location, LocationDescriptor, LocationState, Path } from 'history';

    export { History, Location, LocationDescriptor, LocationState };

    export interface match<Params extends { [K in keyof Params]?: string } = {}> {
        params: Params;
        isExact: boolean;
        path: string;
        url: string;
    }

    export interface RouteComponentProps<
        Params extends { [K in keyof Params]?: string } = {},
        C = unknown,
        S = LocationState,
    > {
        history: History<S>;
        location: Location<S>;
        match: match<Params>;
        staticContext?: C;
    }

    export interface RouteChildrenProps<
        Params extends { [K in keyof Params]?: string } = {},
        S = LocationState,
    > {
        history: History<S>;
        location: Location<S>;
        match: match<Params> | null;
    }

    export interface RouteProps<
        Path extends string = string,
        Params extends { [K in keyof Params]?: string } = {},
    > {
        location?: Location;
        component?: React.ComponentType<RouteComponentProps<any>> | React.ComponentType<any>;
        render?: (props: RouteComponentProps<any>) => React.ReactNode;
        children?: ((props: RouteChildrenProps<any>) => React.ReactNode) | React.ReactNode;
        path?: string | string[];
        exact?: boolean;
        sensitive?: boolean;
        strict?: boolean;
    }

    export class Route<T extends RouteProps = RouteProps> extends React.Component<T, any> {}

    export interface SwitchProps {
        children?: React.ReactNode;
        location?: Location;
    }
    export class Switch extends React.Component<SwitchProps, any> {}

    export interface RedirectProps {
        to: LocationDescriptor;
        push?: boolean;
        from?: string;
        path?: string;
        exact?: boolean;
        strict?: boolean;
    }
    export class Redirect extends React.Component<RedirectProps, any> {}

    export interface PromptProps {
        message: string | ((location: Location, action: string) => string | boolean);
        when?: boolean;
    }
    export class Prompt extends React.Component<PromptProps, any> {}

    export interface RouterProps {
        history: History;
        children?: React.ReactNode;
    }
    export class Router extends React.Component<RouterProps, any> {}

    export interface MemoryRouterProps {
        initialEntries?: LocationDescriptor[];
        initialIndex?: number;
        getUserConfirmation?: (message: string, callback: (ok: boolean) => void) => void;
        keyLength?: number;
        children?: React.ReactNode;
    }
    export class MemoryRouter extends React.Component<MemoryRouterProps, any> {}

    export interface StaticRouterProps {
        basename?: string;
        location?: string | object;
        context?: object;
        children?: React.ReactNode;
    }
    export class StaticRouter extends React.Component<StaticRouterProps, any> {}

    export interface matchPathOptions {
        path?: string | string[];
        exact?: boolean;
        sensitive?: boolean;
        strict?: boolean;
    }
    export function matchPath<Params extends { [K in keyof Params]?: string } = {}>(
        pathname: string,
        props: string | string[] | matchPathOptions,
        parent?: match<Params> | null,
    ): match<Params> | null;

    export function generatePath(pattern: string, params?: { [paramName: string]: string | number | boolean | undefined }): string;

    export function withRouter<P extends RouteComponentProps<any>, C extends React.ComponentType<P>>(
        component: C & React.ComponentType<P>,
    ): React.ComponentClass<Omit<P, keyof RouteComponentProps<any>> & { wrappedComponentRef?: React.Ref<InstanceType<C>> }> & {
        WrappedComponent: C;
    };

    export function useHistory<HistoryLocationState = LocationState>(): History<HistoryLocationState>;
    export function useLocation<S = LocationState>(): Location<S>;
    export function useParams<Params extends { [K in keyof Params]?: string } = {}>(): Params;
    export function useRouteMatch<Params extends { [K in keyof Params]?: string } = {}>(
        path?: string | string[] | matchPathOptions,
    ): match<Params>;

    export interface RouterChildContext {
        router: {
            history: History;
            route: {
                location: Location;
                match: match;
            };
        };
    }
}

declare module 'react-router-dom' {
    import * as React from 'react';
    import { History, Location, LocationDescriptor, LocationState, Path } from 'history';
    import {
        match,
        RouteComponentProps,
        RouteChildrenProps,
        RouteProps,
        Route,
        Switch,
        SwitchProps,
        Redirect,
        RedirectProps,
        Prompt,
        PromptProps,
        Router,
        RouterProps,
        MemoryRouter,
        MemoryRouterProps,
        StaticRouter,
        StaticRouterProps,
        matchPath,
        matchPathOptions,
        generatePath,
        withRouter,
        useHistory,
        useLocation,
        useParams,
        useRouteMatch,
        RouterChildContext,
    } from 'react-router';

    export {
        match,
        RouteComponentProps,
        RouteChildrenProps,
        RouteProps,
        Route,
        Switch,
        SwitchProps,
        Redirect,
        RedirectProps,
        Prompt,
        PromptProps,
        Router,
        RouterProps,
        MemoryRouter,
        MemoryRouterProps,
        StaticRouter,
        StaticRouterProps,
        matchPath,
        matchPathOptions,
        generatePath,
        withRouter,
        useHistory,
        useLocation,
        useParams,
        useRouteMatch,
        RouterChildContext,
        History,
        Location,
        LocationDescriptor,
        LocationState,
    };

    export interface BrowserRouterProps {
        basename?: string;
        getUserConfirmation?: (message: string, callback: (ok: boolean) => void) => void;
        forceRefresh?: boolean;
        keyLength?: number;
        children?: React.ReactNode;
    }
    export class BrowserRouter extends React.Component<BrowserRouterProps, any> {}

    export interface HashRouterProps {
        basename?: string;
        getUserConfirmation?: (message: string, callback: (ok: boolean) => void) => void;
        hashType?: 'slash' | 'noslash' | 'hashbang';
        children?: React.ReactNode;
    }
    export class HashRouter extends React.Component<HashRouterProps, any> {}

    export interface LinkProps<S = LocationState>
        extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
        to: LocationDescriptor<S> | ((location: Location<S>) => LocationDescriptor<S>);
        replace?: boolean;
        innerRef?: React.Ref<HTMLAnchorElement>;
        component?: React.ComponentType<any>;
    }
    export class Link<S = LocationState> extends React.Component<LinkProps<S>, any> {}

    export interface NavLinkProps<S = LocationState> extends LinkProps<S> {
        activeClassName?: string;
        activeStyle?: React.CSSProperties;
        exact?: boolean;
        strict?: boolean;
        isActive?: (match: match<any> | null, location: Location<S>) => boolean;
        location?: Location<S>;
    }
    export class NavLink<S = LocationState> extends React.Component<NavLinkProps<S>, any> {}
}
