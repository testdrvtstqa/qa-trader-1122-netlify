import { initiateLogin, initiateSignUp, parseReferralLink } from '@/external/deriv-core';
import { getOAuthScopes } from '@/utils/oauth-scopes';

/**
 * Login/sign-up for the white-label template. Upstream DTrader redirected to
 * the brand hub (`${getBrandUrl()}/login`), which resolves to the
 * brand.config.json placeholder hostname (yourbrand.com) in a partner deploy.
 * The template instead runs the same OAuth2 PKCE flow as the bot template via
 * the vendored deriv-core: redirect to auth.deriv.com with the partner's
 * NEXT_PUBLIC_DERIV_APP_ID and return to this app's origin, where the shell
 * (src/main.tsx) handles the ?code= callback and persists the session.
 */
const getAuthConfig = () => ({
    clientId: process.env.NEXT_PUBLIC_DERIV_APP_ID || '',
    redirectUri: window.location.origin,
    // Must match the scopes the shell's OAuth callback exchanges the code with
    // (src/main.tsx) AND the scopes the app is registered with — Deriv rejects
    // anything outside the registration with error=invalid_scope.
    scopes: getOAuthScopes(),
    ...(parseReferralLink(process.env.NEXT_PUBLIC_DERIV_REFERRAL_LINK || '') ?? {}),
});

export const redirectToLogin = (_language?: string) => {
    initiateLogin(getAuthConfig());
};

export const redirectToSignUp = (_language?: string) => {
    initiateSignUp(getAuthConfig());
};
