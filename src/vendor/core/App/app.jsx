import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import PropTypes from 'prop-types';

import { APIProvider, useMobileBridge } from '@deriv/api';
import { Loading } from '@deriv/components';
import { initFormErrorMessages, setUrlLanguage, setWebsocket } from '@deriv/shared';
import { StoreProvider } from '@deriv/stores';
import { Analytics } from '@deriv-com/analytics';
import { BreakpointProvider } from '@deriv-com/quill-ui';
import { getInitialLanguage, initializeI18n, TranslationProvider } from '@deriv-com/translations';

import WS from '@core/Services/ws-methods';

import { FORM_ERROR_MESSAGES } from '../Constants/form-error-messages';

import AppContent from './AppContent';

// App Builder live-preview branding listener (theme/colour/font/logo/name).
// The import() must live INSIDE the compile-time-constant branch: the BFF
// strips src/preview/ from standalone partner deploys, and a top-level lazy
// import would still be resolved at build time and fail there. With the env
// inlined by rsbuild's define, the dead branch (and its import) is dropped
// from standalone builds entirely.
const PreviewBranding =
    process.env.NEXT_PUBLIC_APP_BUILD === 'true'
        ? React.lazy(() => import('@/preview/preview-branding'))
        : null;

import '@core/Sass/app.scss';

const App = ({ root_store }) => {
    // Use the Crowdin CDN only when its env vars are actually configured.
    // The template build usually ships without them, and the naive template
    // string produces a malformed host ("https://translations/en.json" →
    // ERR_NAME_NOT_RESOLVED). Fall back to our own origin, where
    // public/translations/en.json (an empty catalog) satisfies the fetch and
    // the bundled English defaults are used.
    const translations_cdn =
        process.env.CROWDIN_URL && process.env.R2_PROJECT_NAME
            ? `${process.env.CROWDIN_URL}/${process.env.R2_PROJECT_NAME}/${process.env.CROWDIN_BRANCH_NAME}`
            : `${window.location.origin}${process.env.NEXT_PUBLIC_APP_BUILD === 'true' ? '/trader/preview' : ''}`;
    const i18nInstance = initializeI18n({ cdnUrl: translations_cdn });
    const l = window.location;
    const base = l.pathname.split('/')[1];
    const has_base = /^\/(br_)/.test(l.pathname);
    const { preferred_language } = root_store.client;
    const { is_dark_mode_on } = root_store.ui;
    const is_dark_mode = is_dark_mode_on || JSON.parse(localStorage.getItem('ui_store'))?.is_dark_mode_on;
    const language = preferred_language ?? getInitialLanguage();
    const { isBridgeAvailable, sendBridgeEvent } = useMobileBridge();

    // Send trading:ready event to ensure smooth loader transition
    React.useEffect(() => {
        if (isBridgeAvailable) {
            sendBridgeEvent('trading:ready');
        }
    }, [isBridgeAvailable, sendBridgeEvent]);

    React.useEffect(() => {
        sessionStorage.removeItem('redirect_url');
        const loadSmartchartsStyles = () => {
            import('@deriv-com/smartcharts-champion/dist/smartcharts.css');
        };

        // Check for theme query parameter and set theme accordingly
        const urlParams = new URLSearchParams(window.location.search);
        const themeParam = urlParams.get('theme');
        if (themeParam === 'dark') {
            root_store.ui.setDarkMode(true);
        } else if (themeParam === 'light') {
            root_store.ui.setDarkMode(false);
        }

        // TODO: [translation-to-shared]: add translation implemnentation in shared
        setUrlLanguage(language);
        initFormErrorMessages(FORM_ERROR_MESSAGES);
        root_store.common.setPlatform();
        loadSmartchartsStyles();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const platform_passthrough = {
        root_store,
        WS,
        i18nInstance,
        language,
    };

    setWebsocket(WS);

    React.useEffect(() => {
        if (!root_store.client.email) {
            Analytics.reset();
        }
    }, [root_store.client.email]);

    React.useEffect(() => {
        const html = document?.querySelector('html');

        if (!html) return;
        if (is_dark_mode) {
            html.classList?.remove('light');
            html.classList?.add('dark');
        } else {
            html.classList?.remove('dark');
            html.classList?.add('light');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // The App Builder static preview build is served under /trader/preview (see
    // rsbuild assetPrefix), so the router must resolve routes under that prefix —
    // otherwise every route 404s inside the preview iframe. Standalone partner
    // deploys are served at the root (legacy /br_* aware via has_base).
    const preview_basename = process.env.NEXT_PUBLIC_APP_BUILD === 'true' ? '/trader/preview' : null;

    return (
        <Router basename={preview_basename ?? (has_base ? `/${base}` : null)}>
            <StoreProvider store={root_store}>
                {PreviewBranding && (
                    <React.Suspense fallback={null}>
                        <PreviewBranding />
                    </React.Suspense>
                )}
                <BreakpointProvider>
                    <APIProvider>
                        <TranslationProvider defaultLang={language} i18nInstance={i18nInstance}>
                            {/* This is required as translation provider uses suspense to reload language */}
                            <React.Suspense fallback={<Loading />}>
                                <AppContent passthrough={platform_passthrough} />
                            </React.Suspense>
                        </TranslationProvider>
                    </APIProvider>
                </BreakpointProvider>
            </StoreProvider>
        </Router>
    );
};

App.propTypes = {
    root_store: PropTypes.object,
};

export default App;
