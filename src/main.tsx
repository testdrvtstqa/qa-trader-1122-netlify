/* eslint-disable import/no-named-as-default-member */
/* eslint-disable import/no-named-as-default */
import { configure } from 'mobx';
import { createRoot } from 'react-dom/client';

// Real DTrader entry — mirrors src/vendor/core/index.tsx.
import App from '@core/App/app.jsx';
import { connectClient, initStore } from '@core/App/initStore';
import AppNotificationMessages from '@core/App/Containers/app-notification-messages.jsx';

import { cleanupUrl, fetchAccounts, handleOAuthCallback } from './external/deriv-core';
import {
    applyBrandFontFromConfig,
    applyDocumentTitle,
    applyFaviconFromLogo,
    applyPrimaryColorFromConfig,
} from './utils/document-branding';
import { rehydrateAccountKeys } from './utils/auth-session';
import { getOAuthScopes } from './utils/oauth-scopes';
import { applyReact19DomPolyfills } from './utils/react19-dom-polyfills';
import { performVersionCheck } from './utils/version-check';
import './styles/index.scss';
import './components/brand-logo.scss';

applyReact19DomPolyfills();

// Configure MobX to handle multiple instances in production builds
configure({ isolateGlobalState: true });

// Perform version check FIRST - before any other operations
performVersionCheck();

// Apply deploy-time document branding (tab title, web font, primary color, favicon).
// The primary colour must be applied before the favicon: the letter-badge fallback
// is drawn on the applied brand colour.
applyDocumentTitle();
applyBrandFontFromConfig();
applyPrimaryColorFromConfig();
applyFaviconFromLogo();

// Shell OAuth seam: when Deriv redirects back with ?code=, exchange it for tokens
// and persist the account list before the DTrader store bootstrap validates the
// session via whoami. fetchAccounts writes active_loginid / account_type to storage
// itself, so initStore/connectClient pick up the freshly authenticated session.
const handleOAuthRedirect = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has('code')) return;

    try {
        const clientId = process.env.NEXT_PUBLIC_DERIV_APP_ID || '';
        const authInfo = await handleOAuthCallback(window.location.href, {
            clientId,
            redirectUri: window.location.origin,
            // Must stay in sync with vendor/shared/utils/login/login.ts — the
            // exchange fails if it doesn't match the authorize request. Both read
            // the same helper, which resolves the wizard's registered scopes.
            scopes: getOAuthScopes(),
        });

        const accounts = await fetchAccounts(authInfo, clientId);
        if (accounts && accounts.length > 0) {
            // The vendored DTrader stores key their session off localStorage
            // `account_id` / `account_type` (see @deriv/shared getAccountId →
            // initStore → connectClient), while deriv-core writes
            // `active_loginid`. Bridge the champion keys here — this runs
            // before initStore reads them to decide the logged-in state.
            const first_account = accounts[0];
            localStorage.setItem('account_id', first_account.account_id);
            localStorage.setItem('account_type', first_account.account_type);
        } else {
            // eslint-disable-next-line no-console
            console.error('No accounts returned after authentication');
        }
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('OAuth callback error:', error);
    } finally {
        cleanupUrl(window.location.origin);
    }
};

const initApp = async () => {
    // Run the OAuth code exchange (if any) before the store bootstrap so whoami sees
    // the authenticated session.
    await handleOAuthRedirect();

    // Recover the vendored stores' account keys when an OAuth session outlived
    // them (an earlier build's connection-error handler wiped them). Must run
    // before initStore, which reads them to decide the logged-in state.
    rehydrateAccountKeys();

    // Validate session and create the RootStore. React mounts as soon as this resolves.
    const { root_store, external_id, account_id } = await initStore(AppNotificationMessages);

    const wrapper = document.getElementById('derivatives_trader');
    if (wrapper) {
        const root = createRoot(wrapper);
        root.render(<App root_store={root_store} />);
    }

    // Open the WebSocket and finish initializing the client store in the background.
    // Components observe `is_logging_in` / `is_client_store_initialized` for loading state.
    // The socket mints its own authenticated URL when it opens, so there is
    // nothing to await here first.
    connectClient(root_store, external_id, account_id).catch(e => {
        // eslint-disable-next-line no-console
        console.error('connectClient failed:', e);
    });
};

initApp();
