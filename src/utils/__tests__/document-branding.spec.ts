describe('applyPrimaryColorFromConfig', () => {
    afterEach(() => {
        // apply-branding injects a <style data-brand-color> into the shared jsdom
        // <head>; drop it between cases so each isolate starts clean.
        document.querySelectorAll('style[data-brand-color]').forEach(el => el.remove());
        jest.resetModules();
    });

    it('applies brand.config.json colors.primary via the injected brand stylesheet', () => {
        jest.isolateModules(() => {
            jest.doMock('../../../brand.config.json', () => ({ colors: { primary: '#ff00ff' } }));
            const { applyPrimaryColorFromConfig } = require('../document-branding');

            applyPrimaryColorFromConfig();

            const css = document.head.querySelector('style[data-brand-color]')?.textContent ?? '';
            // Both the semantic name and the legacy alias the UI reads.
            expect(css).toContain('--brand-primary: rgb(255, 0, 255) !important');
            expect(css).toContain('--brand-red-coral: rgb(255, 0, 255) !important');
        });
    });

    it('forwards colors.secondary as the Fall colour', () => {
        jest.isolateModules(() => {
            jest.doMock('../../../brand.config.json', () => ({
                colors: { primary: '#7b2ff7', secondary: '#0051ff' },
            }));
            const { applyPrimaryColorFromConfig } = require('../document-branding');

            applyPrimaryColorFromConfig();

            const css = document.head.querySelector('style[data-brand-color]')?.textContent ?? '';
            expect(css).toContain('--color-trade-sell: rgb(0, 81, 255) !important');
            // Rise stays on the primary.
            expect(css).toContain('--color-trade-buy: rgb(123, 47, 247) !important');
        });
    });

    it('falls back to the stock cherry Fall colour when colors.secondary is absent', () => {
        // Every app deployed before the App Builder offered a second picker has
        // a brand.config.json with no `secondary` key.
        jest.isolateModules(() => {
            jest.doMock('../../../brand.config.json', () => ({ colors: { primary: '#7b2ff7' } }));
            const { applyPrimaryColorFromConfig } = require('../document-branding');

            applyPrimaryColorFromConfig();

            const css = document.head.querySelector('style[data-brand-color]')?.textContent ?? '';
            expect(css).toContain('--color-trade-sell: rgb(222, 0, 64) !important');
        });
    });

    it('is a no-op when colors.primary is absent', () => {
        jest.isolateModules(() => {
            jest.doMock('../../../brand.config.json', () => ({ colors: {} }));
            const { applyPrimaryColorFromConfig } = require('../document-branding');

            applyPrimaryColorFromConfig();

            expect(document.head.querySelector('style[data-brand-color]')).toBeNull();
        });
    });
});

describe('applyFaviconFromLogo', () => {
    const RealImage = global.Image;
    const originalAppName = process.env.NEXT_PUBLIC_DERIV_APP_NAME;
    let imageProbeCount = 0;
    let probedSrcs: string[] = [];

    beforeEach(() => {
        // getAppName prefers the injected env var — clear it so the mocked
        // brand.config.json platform.name drives the letter badge.
        delete process.env.NEXT_PUBLIC_DERIV_APP_NAME;
        imageProbeCount = 0;
        probedSrcs = [];
        // Minimal Image stub that records probe attempts (each candidate sets `src`).
        // @ts-expect-error - partial stub is enough for the probing path under test.
        global.Image = class {
            onload: (() => void) | null = null;
            onerror: (() => void) | null = null;
            set src(value: string) {
                imageProbeCount += 1;
                probedSrcs.push(value);
            }
        };
    });

    afterEach(() => {
        global.Image = RealImage;
        process.env.NEXT_PUBLIC_DERIV_APP_NAME = originalAppName;
        document.querySelectorAll('link[rel="icon"]').forEach(el => el.remove());
        jest.resetModules();
    });

    it('probes logo candidates in standalone (non-preview) builds', () => {
        jest.isolateModules(() => {
            jest.doMock('../is-preview-mode', () => ({ isPreviewMode: () => false }));
            const { applyFaviconFromLogo } = require('../document-branding');

            applyFaviconFromLogo();

            expect(imageProbeCount).toBeGreaterThan(0);
        });
    });

    it('sets the letter badge without probing when brand.config.json records no logo (logo_path: null)', () => {
        jest.isolateModules(() => {
            jest.doMock('../is-preview-mode', () => ({ isPreviewMode: () => false }));
            jest.doMock('../../../brand.config.json', () => ({
                platform: { name: 'Quokka', logo_path: null },
                colors: { primary: '#abcdef' },
            }));
            const { applyFaviconFromLogo } = require('../document-branding');

            applyFaviconFromLogo();

            // The BFF said no logo ships — no candidate may be requested (no 404 noise)…
            expect(imageProbeCount).toBe(0);
            // …and the letter badge takes over directly.
            const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
            expect(link?.href).toMatch(/^data:image\/svg\+xml;base64,/);
        });
    });

    it('probes only the exact logo_path the BFF recorded', () => {
        jest.isolateModules(() => {
            jest.doMock('../is-preview-mode', () => ({ isPreviewMode: () => false }));
            jest.doMock('../../../brand.config.json', () => ({
                platform: { name: 'Quokka', logo_path: '/logo.webp' },
                colors: { primary: '#abcdef' },
            }));
            const { applyFaviconFromLogo } = require('../document-branding');

            applyFaviconFromLogo();

            // The BFF knows the real extension — no guessing across candidates.
            expect(probedSrcs).toEqual(['/logo.webp']);
        });
    });

    it('sets the letter-badge favicon without probing in the preview build', () => {
        jest.isolateModules(() => {
            jest.doMock('../is-preview-mode', () => ({ isPreviewMode: () => true }));
            jest.doMock('../../../brand.config.json', () => ({
                platform: { name: 'Quokka' },
                colors: { primary: '#abcdef' },
            }));
            const { applyFaviconFromLogo } = require('../document-branding');

            applyFaviconFromLogo();

            // The preview build ships no public/logo.*, so it must not probe files…
            expect(imageProbeCount).toBe(0);
            // …but it must still show the letter badge rather than the deriv default.
            const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
            expect(link?.href).toMatch(/^data:image\/svg\+xml;base64,/);
            expect(atob(link!.href.replace('data:image/svg+xml;base64,', ''))).toContain('>Q</text>');
        });
    });

    it('draws the letter badge with the applied primary colour, ignoring the stock theme variable', () => {
        jest.isolateModules(() => {
            jest.doMock('../is-preview-mode', () => ({ isPreviewMode: () => true }));
            jest.doMock('../../../brand.config.json', () => ({
                platform: { name: 'Quokka' },
                colors: { primary: '#abcdef' },
            }));
            // The stock champion theme declares --brand-primary (Deriv red) at the
            // root; the badge must use the partner colour applied at runtime instead.
            document.documentElement.style.setProperty('--brand-primary', '#ff444f');
            const { applyPrimaryColor } = require('../apply-branding');
            const { buildLetterFaviconUri } = require('../document-branding');

            applyPrimaryColor('#22c55e');

            const svg = atob(
                buildLetterFaviconUri('Quokka').replace('data:image/svg+xml;base64,', '')
            );
            expect(svg).toContain('fill="#22c55e"');
            expect(svg).not.toContain('#ff444f');
            expect(svg).not.toContain('#abcdef');
            document.documentElement.style.removeProperty('--brand-primary');
        });
    });

    it('falls back to a letter-badge SVG favicon when no logo candidate loads', () => {
        // Stub Image so every probed candidate fails — drives the chain to exhaustion.
        // @ts-expect-error - partial stub is enough for the failing-probe path under test.
        global.Image = class {
            onload: (() => void) | null = null;
            onerror: (() => void) | null = null;
            set src(_value: string) {
                this.onerror?.();
            }
        };

        jest.isolateModules(() => {
            jest.doMock('../is-preview-mode', () => ({ isPreviewMode: () => false }));
            jest.doMock('../../../brand.config.json', () => ({
                platform: { name: 'Zephyr' },
                colors: { primary: '#3b82f6' },
            }));
            const { applyFaviconFromLogo } = require('../document-branding');

            applyFaviconFromLogo();

            const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
            expect(link?.href).toMatch(/^data:image\/svg\+xml;base64,/);
            const svg = atob(link!.href.replace('data:image/svg+xml;base64,', ''));
            expect(svg).toContain('>Z</text>');
            expect(svg).toContain('#3b82f6');
        });
    });
});
