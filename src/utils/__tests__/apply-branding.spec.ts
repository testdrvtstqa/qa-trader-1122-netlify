import { applyBrandFont, applyPrimaryColor } from '../apply-branding';

// applyPrimaryColor's only observable output is the injected <style data-brand-color>
// sheet, so every declaration below is read back from it. The first occurrence of a
// token is always the light-theme block (the dark override, when present, is appended
// after and scoped to body.theme--dark).
const getBrandCss = (): string => document.head.querySelector('style[data-brand-color]')?.textContent ?? '';

const cssVar = (css: string, name: string): string | null => {
    const m = css.match(new RegExp(`${name}: (rgba?\\([^)]*\\))`));
    return m ? m[1] : null;
};

describe('applyPrimaryColor — hex parsing', () => {
    it.each([
        ['#ff00ff (full hex)', '#ff00ff', 'rgb(255, 0, 255)'],
        ['#f0f (CSS shorthand)', '#f0f', 'rgb(255, 0, 255)'],
        ['#ABCDEF (uppercase)', '#ABCDEF', 'rgb(171, 205, 239)'],
        ['3b82f6 (missing #)', '3b82f6', 'rgb(59, 130, 246)'],
        [' #3b82f6  (surrounding whitespace)', ' #3b82f6 ', 'rgb(59, 130, 246)'],
    ])('accepts %s', (_label, input, expected) => {
        applyPrimaryColor(input);
        expect(getBrandCss()).toContain(`--brand-primary: ${expected} !important`);
    });

    it.each([
        ['5 hex digits', '#12345'],
        ['non-hex letters', '#gggggg'],
        ['a CSS keyword', 'red'],
        ['an rgb() string', 'rgb(255, 0, 0)'],
        ['an empty string', ''],
    ])('warns and leaves the stylesheet untouched for %s', (_label, input) => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
        const before = getBrandCss();

        applyPrimaryColor(input);

        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0][0]).toContain('invalid brand primary colour');
        expect(getBrandCss()).toBe(before);
    });
});

describe('applyPrimaryColor — derived declarations', () => {
    it('remaps the chrome accent tokens to the brand colour', () => {
        applyPrimaryColor('#ff00ff');
        const css = getBrandCss();
        expect(css).toContain('--brand-red-coral: rgb(255, 0, 255) !important');
        expect(css).toContain('--color-nav-item-active: rgb(255, 0, 255) !important');
        expect(css).toContain('--color-button-primary-bg: rgb(255, 0, 255) !important');
    });

    it('derives the primary-button hover shade by mixing 24% toward black', () => {
        applyPrimaryColor('#ff0000');
        // 255 * (1 - 0.24) = 193.8 → 194
        expect(cssVar(getBrandCss(), '--color-button-primary-hover')).toBe('rgb(194, 0, 0)');
    });

    it('re-derives the coral ladder from the brand colour (700 = base, tints toward white, shades toward black)', () => {
        applyPrimaryColor('#ff0000');
        const css = getBrandCss();
        expect(cssVar(css, '--core-color-solid-coral-700')).toBe('rgb(255, 0, 0)');
        // 100-step tint: mix(base, white, 0.88) → g/b = 255 * 0.88 = 224.4 → 224
        expect(cssVar(css, '--core-color-solid-coral-100')).toBe('rgb(255, 224, 224)');
        // 900-step shade: mix(base, black, 0.24) → r = 255 * 0.76 = 193.8 → 194
        expect(cssVar(css, '--core-color-solid-coral-900')).toBe('rgb(194, 0, 0)');
        // opacity ladder keeps the base channels with the step alpha
        expect(cssVar(css, '--core-color-opacity-coral-500')).toBe('rgba(255, 0, 0, 0.32)');
    });

    it('recolours the baked-in SVG fills inside the chrome scopes', () => {
        applyPrimaryColor('#ff00ff');
        const css = getBrandCss();
        expect(css).toContain("[fill='#ff444f' i]");
        expect(css).toContain('fill: rgb(255, 0, 255) !important');
    });
});

describe('applyPrimaryColor — Rise/Fall colours', () => {
    const STOCK_CHERRY = 'rgb(222, 0, 64)';

    it('uses the secondary colour for Fall and the primary for Rise', () => {
        applyPrimaryColor('#7b2ff7', '#0051ff');
        const css = getBrandCss();
        expect(cssVar(css, '--color-trade-buy')).toBe('rgb(123, 47, 247)');
        expect(cssVar(css, '--color-trade-sell')).toBe('rgb(0, 81, 255)');
    });

    it('drives the cherry ladder and sell glyphs from the secondary colour', () => {
        applyPrimaryColor('#7b2ff7', '#0051ff');
        const css = getBrandCss();
        expect(cssVar(css, '--core-color-solid-cherry-700')).toBe('rgb(0, 81, 255)');
        // The emerald ladder (Rise/Buy) stays on the primary.
        expect(cssVar(css, '--core-color-solid-emerald-700')).toBe('rgb(123, 47, 247)');
        // Baked-in cherry SVG glyphs recolour to the secondary too.
        expect(css).toContain("[fill='#de0040' i]");
        expect(css).toContain('fill: rgb(0, 81, 255) !important');
    });

    it.each([
        ['no secondary passed', undefined],
        ['an empty secondary', ''],
        ['an unparseable secondary', 'not-a-colour'],
    ])('falls back to the stock cherry Fall colour with %s', (_label, secondary) => {
        // Projects created before the App Builder offered a second colour have
        // no secondary at all — Fall must still read as a deliberate "sell".
        jest.spyOn(console, 'warn').mockImplementation(() => undefined);
        applyPrimaryColor('#7b2ff7', secondary);
        expect(cssVar(getBrandCss(), '--color-trade-sell')).toBe(STOCK_CHERRY);
    });

    it.each([
        ['black', '#000000'],
        ['white', '#ffffff'],
        ['mid grey', '#808080'],
    ])('gives an achromatic primary (%s) a distinguishable Fall', (_label, input) => {
        // The old hue-rotation derivation collapsed here: rotating an unsaturated
        // colour returns itself, so Rise and Fall came out identical.
        applyPrimaryColor(input);
        const css = getBrandCss();
        expect(cssVar(css, '--color-trade-sell')).toBe(STOCK_CHERRY);
        expect(cssVar(css, '--color-trade-sell')).not.toBe(cssVar(css, '--color-trade-buy'));
    });

    it('warns but still applies the primary when the secondary is invalid', () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
        applyPrimaryColor('#7b2ff7', 'rgb(0,0,0)');
        expect(warn).toHaveBeenCalledTimes(1);
        expect(cssVar(getBrandCss(), '--color-trade-buy')).toBe('rgb(123, 47, 247)');
    });

    it('lifts a too-dark secondary for the dark theme', () => {
        // A near-black Fall button is as invisible on dark surfaces as a
        // near-black primary, so both get the luminance floor.
        applyPrimaryColor('#7b2ff7', '#010409');
        const css = getBrandCss();
        expect(css).toContain('body.theme--dark');
    });
});

describe('applyBrandFont', () => {
    const getFontCss = (): string => document.head.querySelector('style[data-brand-font]')?.textContent ?? '';

    it('injects the resolved stack for a supported family', () => {
        applyBrandFont('Inter');
        expect(getFontCss()).toBe(
            "body, body * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; }"
        );
    });

    it('accepts the full system stack brand.config.json ships by default', () => {
        const systemStack = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        applyBrandFont(systemStack);
        expect(getFontCss()).toBe(`body, body * { font-family: ${systemStack} !important; }`);
    });

    it('warns and leaves the stylesheet untouched for a family carrying extra CSS', () => {
        applyBrandFont('Inter');
        const before = getFontCss();
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

        // A PREVIEW_BRANDING sender could otherwise append rules of its choosing.
        applyBrandFont('Inter; background: url(https://evil.test/leak)');

        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0][0]).toContain('invalid brand font');
        expect(getFontCss()).toBe(before);
        expect(getFontCss()).not.toContain('evil.test');
    });
});

describe('applyPrimaryColor — dark theme luminance lift', () => {
    it('adds no dark override for colours already above the luminance floor', () => {
        applyPrimaryColor('#ff444f'); // stock Deriv red, relative luminance ≈ 0.26 — above the 0.25 floor
        expect(getBrandCss()).not.toContain('body.theme--dark');
    });

    it('re-derives a lifted base scoped to body.theme--dark for too-dark colours', () => {
        applyPrimaryColor('#000000');
        const css = getBrandCss();
        expect(css).toContain('body.theme--dark .header');

        // The dark block's base must be lifted off black to a grey at the
        // luminance floor (~rgb(137, 137, 137)) — allow ±5 for rounding.
        const darkBlock = css.slice(css.indexOf('body.theme--dark'));
        const m = cssVar(darkBlock, '--brand-primary')?.match(/^rgb\((\d+), (\d+), (\d+)\)$/);
        expect(m).toBeTruthy();
        const [r, g, b] = m!.slice(1).map(Number);
        expect(r).toBe(g);
        expect(g).toBe(b);
        expect(r).toBeGreaterThanOrEqual(132);
        expect(r).toBeLessThanOrEqual(142);
    });
});
