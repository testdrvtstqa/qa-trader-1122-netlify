/**
 * True when the app is running as the App Builder static preview build
 * (served under /trader/preview inside the App Builder iframe). The preview
 * pipeline sets NEXT_PUBLIC_APP_BUILD=true; standalone partner deploys do not.
 */
export const isPreviewMode = (): boolean => process.env.NEXT_PUBLIC_APP_BUILD === 'true';

/**
 * Route/asset base the static preview build is served under. Single source of truth for
 * the runtime side: it matches the rsbuild `assetPrefix` ('/trader/preview/') and the React
 * Router basename. Standalone partner deploys are served at the root, so they do not use it.
 */
export const PREVIEW_BASE_PATH = '/trader/preview';
