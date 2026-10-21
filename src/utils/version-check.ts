const STORAGE_KEY = 'trader_version';
// Bump when a breaking change to persisted local state ships, to force a clean slate.
const CURRENT_VERSION = '0.1.0';

/**
 * Clears stale persisted client state when the deployed template version changes.
 *
 * Standalone partner deploys keep the user's browser storage across redeploys; a
 * version bump here wipes localStorage/sessionStorage once so an incompatible
 * persisted shape can't crash the app on boot. The version key itself is preserved.
 */
export function performVersionCheck(): void {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === CURRENT_VERSION) return;

        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
    } catch (error) {
        // Storage can throw in privacy modes / disabled cookies — non-fatal.
        console.error('Version check failed:', error);
    }
}
