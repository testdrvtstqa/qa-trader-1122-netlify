import fs from 'fs';
import path from 'path';
import { defineConfig, loadEnv, rspack } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSass } from '@rsbuild/plugin-sass';
import { pluginSvgr } from '@rsbuild/plugin-svgr';

// Load .env.production into process.env before `source.define` reads it below.
// Heroku's build doesn't surface it otherwise; a missing file is a no-op.
loadEnv({ mode: 'production' });

const isStaticBuild = process.env.NEXT_PUBLIC_APP_BUILD === 'true';

// The DTrader monorepo prepended a set of shared SCSS partials (constants, mixins,
// fonts, inline-icons, devices) to every .scss file via sass-resources-loader, so
// individual component stylesheets can use mixins/variables (e.g. createBarspinnerAnimation,
// $MOBILE_HEADER_HEIGHT, the `mobile` mixin) without importing them. Replicate that here
// with sass `additionalData`. Order matches shared/styles/index.js.
const sharedSassDir = path.resolve(__dirname, './src/vendor/shared/styles');
const sassResources = [
    'constants/layout.scss',
    'mixins.scss',
    'fonts.scss',
    'inline-icons.scss',
    'devices.scss',
];
const sassAdditionalData = sassResources
    .map(f => `@import "${path.join(sharedSassDir, f).replace(/\\/g, '/')}";`)
    .join('\n');

// Resolve smartcharts from wherever the package actually lives so the asset
// copy works both standalone and inside the monorepo (npm workspaces hoist the
// package to the repo root, so a cwd-relative './node_modules/...' glob fails).
const smartchartsDist = path.join(
    path.dirname(require.resolve('@deriv-com/smartcharts-champion/package.json')),
    'dist'
);

// Resolve react-router v5 with a hard version guard. The vendored DTrader code
// uses v5-only APIs (withRouter, Redirect, Switch); the monorepo root hoists
// react-router-dom@6 (bot's dep), so the v5 copies live nested in THIS
// template's node_modules. Anchor to __dirname first — `require.resolve`'s
// walk-up can land on the root v6 depending on how the config is evaluated
// (observed on CI), which ships a bundle that crashes at runtime with
// "(0, F.withRouter) is not a function". Fail the build loudly instead.
const resolveRouterV5 = (name: string): string => {
    const candidates = [path.join(__dirname, 'node_modules', name)];
    try {
        candidates.push(path.dirname(require.resolve(`${name}/package.json`, { paths: [__dirname] })));
    } catch {
        /* fall through to the guard below */
    }
    for (const dir of candidates) {
        const pkgJson = path.join(dir, 'package.json');
        if (fs.existsSync(pkgJson)) {
            const version = JSON.parse(fs.readFileSync(pkgJson, 'utf8')).version as string;
            if (version.startsWith('5.')) {
                console.log(`[trader rsbuild] ${name}@${version} -> ${dir}`);
                return dir;
            }
            console.warn(`[trader rsbuild] skipping ${name}@${version} at ${dir} (need v5)`);
        }
    }
    throw new Error(
        `[trader rsbuild] Could not resolve ${name}@5. The vendored DTrader code requires ` +
            `react-router v5; check that "${name}" is installed in templates/trader/node_modules.`
    );
};
const reactRouterDomV5 = resolveRouterV5('react-router-dom');
const reactRouterV5 = resolveRouterV5('react-router');

export default defineConfig({
    plugins: [
        pluginSass({
            sassLoaderOptions: {
                sourceMap: true,
                additionalData: sassAdditionalData,
            },
            exclude: /node_modules/,
        }),
        pluginReact(),
        // Upstream DTrader compiled .svg imports to React components via
        // react-svg-loader (default export = component). Without the same
        // semantics, rspack emits data-URL strings and every <Icon/> crashes
        // with createElement('data:image/svg+xml...').
        pluginSvgr({ svgrOptions: { exportType: 'default' } }),
    ],
    source: {
        entry: { index: './src/main.tsx' },
        define: {
            'process.env': {
                // Deriv app id — drives OAuth login/sign-up and WebSocket connections. The
                // preview pipeline sets this from TRADER_APP_ID (see scripts/build-previews.js);
                // sibling templates use the same name.
                NEXT_PUBLIC_DERIV_APP_ID: JSON.stringify(process.env.NEXT_PUBLIC_DERIV_APP_ID ?? ''),
                // Comma-separated OAuth scopes the partner's Deriv app is registered with
                // (set by the App Builder from the wizard selection). The login redirect and
                // the token exchange both send these; asking for a scope outside the
                // registration is rejected with error=invalid_scope. Empty → 'trade'.
                NEXT_PUBLIC_DERIV_OAUTH_SCOPES: JSON.stringify(
                    process.env.NEXT_PUBLIC_DERIV_OAUTH_SCOPES ?? ''
                ),
                // Authoritative environment signal. The trader's URL resolver and the vendored
                // deriv-core OAuth resolver both read this so endpoints stay consistent on a
                // deployed partner domain (where hostname detection can't match Deriv).
                NEXT_PUBLIC_DERIV_ENV: JSON.stringify(process.env.NEXT_PUBLIC_DERIV_ENV ?? ''),
                // Partner referral link for affiliate attribution on OAuth login/sign-up.
                NEXT_PUBLIC_DERIV_REFERRAL_LINK: JSON.stringify(process.env.NEXT_PUBLIC_DERIV_REFERRAL_LINK ?? ''),
                // Partner app name. The BFF writes this into .env.production at deploy time; the header
                // logo+name mark and the document title read it (with brand.config / default fallback).
                NEXT_PUBLIC_DERIV_APP_NAME: JSON.stringify(process.env.NEXT_PUBLIC_DERIV_APP_NAME ?? ''),
                // Marks the static preview build (served under /trader/preview); drives the
                // router basename so React Router resolves under that path prefix.
                NEXT_PUBLIC_APP_BUILD: JSON.stringify(process.env.NEXT_PUBLIC_APP_BUILD ?? ''),

                // --- Ported DTrader (vendor) env reads ---
                // app.jsx builds the translations CDN url from these three
                // (`${CROWDIN_URL}/${R2_PROJECT_NAME}/${CROWDIN_BRANCH_NAME}`). Defined as
                // empty strings by default so the expression stays a well-formed string.
                CROWDIN_URL: JSON.stringify(process.env.CROWDIN_URL ?? ''),
                R2_PROJECT_NAME: JSON.stringify(process.env.R2_PROJECT_NAME ?? ''),
                CROWDIN_BRANCH_NAME: JSON.stringify(
                    process.env.CROWDIN_BRANCH_NAME ?? process.env.R2_PROJECT_BRANCH ?? ''
                ),
                R2_PROJECT_BRANCH: JSON.stringify(process.env.R2_PROJECT_BRANCH ?? ''),
                // Optional analytics/monitoring keys the vendor code reads defensively.
                // Defined so `process.env.X` resolves to '' rather than throwing on the
                // replaced object (analytics init is a no-op when these are empty).
                REMOTE_CONFIG_URL: JSON.stringify(process.env.REMOTE_CONFIG_URL ?? ''),
                REF_NAME: JSON.stringify(process.env.REF_NAME ?? ''),
                RUDDERSTACK_KEY: JSON.stringify(process.env.RUDDERSTACK_KEY ?? ''),
                TRACKJS_TOKEN: JSON.stringify(process.env.TRACKJS_TOKEN ?? ''),
                POSTHOG_KEY: JSON.stringify(process.env.POSTHOG_KEY ?? ''),
                POSTHOG_HOST: JSON.stringify(process.env.POSTHOG_HOST ?? ''),
                DATADOG_APPLICATION_ID: JSON.stringify(process.env.DATADOG_APPLICATION_ID ?? ''),
                DATADOG_CLIENT_TOKEN: JSON.stringify(process.env.DATADOG_CLIENT_TOKEN ?? ''),
                DATADOG_SESSION_SAMPLE_RATE: JSON.stringify(process.env.DATADOG_SESSION_SAMPLE_RATE ?? ''),
                DATADOG_SESSION_REPLAY_SAMPLE_RATE: JSON.stringify(
                    process.env.DATADOG_SESSION_REPLAY_SAMPLE_RATE ?? ''
                ),
                NODE_ENV: JSON.stringify(process.env.NODE_ENV ?? 'production'),
            },
        },
        alias: {
            // Resolve from wherever the package actually lives so the build works
            // both standalone and inside the monorepo (npm workspaces hoist react to
            // the repo root, so a cwd-relative './node_modules/react' fails in CI).
            react: path.dirname(require.resolve('react/package.json')),
            'react-dom': path.dirname(require.resolve('react-dom/package.json')),

            // Pinned + version-guarded at the top of this file (must be v5).
            'react-router-dom': reactRouterDomV5,
            'react-router': reactRouterV5,

            // --- Trader shell (vendored deriv-core + shell utils) ---
            '@/external': path.resolve(__dirname, './src/external'),
            '@/components': path.resolve(__dirname, './src/components'),
            '@/hooks': path.resolve(__dirname, './src/hooks'),
            '@/utils': path.resolve(__dirname, './src/utils'),
            '@/constants': path.resolve(__dirname, './src/constants'),
            '@/stores': path.resolve(__dirname, './src/stores'),
            '@/preview': path.resolve(__dirname, './src/preview'),

            // --- Ported DTrader packages (kept separate under src/vendor/*) ---
            // Some cross-package imports carry the original monorepo layout's `/src/`
            // segment (e.g. `@deriv/reports/src/Stores/useReportsStores`). The vendor
            // folders are flattened without that `src/` level, so map `<pkg>/src` to the
            // package root. These longer keys win over the plain `@deriv/<pkg>` keys below.
            '@deriv/core/src': path.resolve(__dirname, './src/vendor/core'),
            '@deriv/trader/src': path.resolve(__dirname, './src/vendor/trader'),
            '@deriv/reports/src': path.resolve(__dirname, './src/vendor/reports'),
            '@deriv/shared/src': path.resolve(__dirname, './src/vendor/shared'),
            '@deriv/stores/src': path.resolve(__dirname, './src/vendor/stores'),
            '@deriv/components/src': path.resolve(__dirname, './src'),
            '@deriv/api/src': path.resolve(__dirname, './src/vendor/api'),
            '@deriv/utils/src': path.resolve(__dirname, './src/vendor/utils'),

            // Cross-package @deriv/* imports — one folder each, no ambiguity.
            '@deriv/core': path.resolve(__dirname, './src/vendor/core'),
            '@deriv/trader': path.resolve(__dirname, './src/vendor/trader'),
            '@deriv/reports': path.resolve(__dirname, './src/vendor/reports'),
            '@deriv/shared': path.resolve(__dirname, './src/vendor/shared'),
            '@deriv/stores': path.resolve(__dirname, './src/vendor/stores'),
            '@deriv/components': path.resolve(__dirname, './src/components'),
            '@deriv/api': path.resolve(__dirname, './src/vendor/api'),
            '@deriv/utils': path.resolve(__dirname, './src/vendor/utils'),

            // Per-package Module-path aliases. The original monorepo resolved bare
            // aliases (Stores/, Modules/, Services/…) against each package's own src
            // via a separate webpack config; in one flat build they collide, so each
            // package's imports are rewritten to a package-namespaced alias.
            // core:
            '@core/_common': path.resolve(__dirname, './src/vendor/core/_common'),
            '@core/App': path.resolve(__dirname, './src/vendor/core/App'),
            '@core/Assets': path.resolve(__dirname, './src/vendor/core/Assets'),
            '@core/Constants': path.resolve(__dirname, './src/vendor/core/Constants'),
            '@core/Fonts': path.resolve(__dirname, './src/vendor/core/public/fonts'),
            '@core/Images': path.resolve(__dirname, './src/vendor/core/public/images'),
            '@core/Modules': path.resolve(__dirname, './src/vendor/core/Modules'),
            '@core/Sass': path.resolve(__dirname, './src/vendor/core/sass'),
            '@core/Services': path.resolve(__dirname, './src/vendor/core/Services'),
            '@core/Stores': path.resolve(__dirname, './src/vendor/core/Stores'),
            '@core/Translations': path.resolve(__dirname, './src/vendor/core/public/translations'),
            '@core/Utils': path.resolve(__dirname, './src/vendor/core/Utils'),
            // trader:
            '@trader/_common': path.resolve(__dirname, './src/vendor/trader/_common'),
            '@trader/AppV2': path.resolve(__dirname, './src/vendor/trader/AppV2'),
            '@trader/Assets': path.resolve(__dirname, './src/vendor/trader/Assets'),
            '@trader/Constants': path.resolve(__dirname, './src/vendor/trader/Constants'),
            '@trader/Fonts': path.resolve(__dirname, './src/vendor/trader/public/fonts'),
            '@trader/Images': path.resolve(__dirname, './src/vendor/trader/public/images'),
            '@trader/Modules': path.resolve(__dirname, './src/vendor/trader/Modules'),
            '@trader/Sass': path.resolve(__dirname, './src/vendor/trader/sass'),
            '@trader/Services': path.resolve(__dirname, './src/vendor/trader/Services'),
            '@trader/Stores': path.resolve(__dirname, './src/vendor/trader/Stores'),
            '@trader/Translations': path.resolve(__dirname, './src/vendor/trader/public/translations'),
            '@trader/Types': path.resolve(__dirname, './src/vendor/trader/Types'),
            '@trader/Utils': path.resolve(__dirname, './src/vendor/trader/Utils'),
            // Bundled static assets (guide .lottie animations). Upstream fetched these
            // from a Deriv domain at runtime; here they are imported so rspack emits
            // them and a partner deploy serves them from its own origin.
            '@trader/public': path.resolve(__dirname, './src/vendor/trader/public'),
            // reports:
            '@reports/_common': path.resolve(__dirname, './src/vendor/reports/_common'),
            '@reports/Constants': path.resolve(__dirname, './src/vendor/reports/Constants'),
            '@reports/Components': path.resolve(__dirname, './src/vendor/reports/Components'),
            '@reports/Containers': path.resolve(__dirname, './src/vendor/reports/Containers'),
            '@reports/Modules': path.resolve(__dirname, './src/vendor/reports/Modules'),
            '@reports/Sass': path.resolve(__dirname, './src/vendor/reports/sass'),
            '@reports/Stores': path.resolve(__dirname, './src/vendor/reports/Stores'),
            '@reports/Types': path.resolve(__dirname, './src/vendor/reports/Types'),
        },
    },
    output: {
        assetPrefix: isStaticBuild ? '/trader/preview/' : '/',
        distPath: {
            root: isStaticBuild ? 'out/preview' : 'dist',
        },
        copy: [
            {
                from: path.join(smartchartsDist, '*'),
                to: 'js/smartcharts/[name][ext]',
                globOptions: { ignore: ['**/*.LICENSE.txt'] },
            },
            // The flutter/canvaskit chart renderer lives in dist/chart/ and must keep its
            // directory structure so SmartCharts can load /js/smartcharts/chart/canvaskit/...
            { from: path.join(smartchartsDist, 'chart'), to: 'js/smartcharts/chart' },
            // Flutter resolves its asset bundle (AssetManifest.json, FontManifest.json, fonts,
            // packages) against the SmartCharts public path — /js/smartcharts/assets/ — even
            // though the engine files load from chart/. Mirror dist/assets/ there, preserving
            // structure.
            { from: path.join(smartchartsDist, 'assets'), to: 'js/smartcharts/assets' },
            { from: path.join(smartchartsDist, 'assets/*'), to: 'assets/[name][ext]' },
            { from: path.join(smartchartsDist, 'assets/fonts/*'), to: 'assets/fonts/[name][ext]' },
            { from: path.join(smartchartsDist, 'assets/shaders/*'), to: 'assets/shaders/[name][ext]' },
            { from: path.join(__dirname, 'public') },
        ],
    },
    tools: {
        rspack(config, { appendPlugins, appendRules }) {
            // @deriv-com/quill-ui@1.x vendors a React 18 jsx-runtime that reads
            // React.__SECRET_INTERNALS_…ReactCurrentOwner (removed in React 19). Remap
            // it so Button / Skeleton / ThemeProvider etc. work under React 19.
            appendPlugins(
                new rspack.NormalModuleReplacementPlugin(
                    /@deriv-com[\\/]quill-ui[\\/]dist[\\/]jsx-runtime[^/]*\.js$/,
                    path.resolve(__dirname, './src/utils/quill-ui-jsx-runtime-shim.js')
                )
            );
            // dotLottie animations for the trade-type guide. Not a built-in
            // rsbuild asset type, so register it explicitly. `asset/resource`
            // (never inlined) keeps these 12-20KB binaries out of the JS
            // bundle — DotLottieReact takes a URL and fetches it itself.
            appendRules({
                test: /\.lottie$/i,
                type: 'asset/resource',
                generator: { filename: 'static/lottie/[name].[contenthash:8][ext]' },
            });
            return config;
        },
    },
    html: { template: './index.html' },
    server: {
        compress: true,
    },
    dev: { hmr: true },
});
