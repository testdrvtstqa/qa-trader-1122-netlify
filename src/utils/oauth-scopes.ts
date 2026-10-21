/**
 * OAuth scopes for the login redirect and the matching token exchange.
 *
 * The App Builder registers the partner's Deriv app with exactly the scopes
 * picked in the wizard, and Deriv rejects an authorize request that asks for
 * anything outside that set (`error=invalid_scope`). So the scopes must come
 * from the deploy-time config, not a literal in the source: hardcoding
 * `trade account_manage` broke every app registered with `trade` alone.
 *
 * The BFF writes the wizard's selection to NEXT_PUBLIC_DERIV_OAUTH_SCOPES as a
 * comma-separated list; OAuth wants it space-separated.
 *
 * Both the authorize request (utils/login) and the code exchange (main.tsx)
 * MUST send the same value — Deriv compares them — which is why this is one
 * shared helper rather than a constant repeated at each call site.
 */

/** Fallback when the var is absent (local dev, or a self-hosted build). */
const DEFAULT_SCOPES = 'trade';

export const getOAuthScopes = (): string => {
    const configured = (process.env.NEXT_PUBLIC_DERIV_OAUTH_SCOPES || '')
        .split(',')
        .map(scope => scope.trim())
        .filter(Boolean);

    return configured.length > 0 ? configured.join(' ') : DEFAULT_SCOPES;
};
