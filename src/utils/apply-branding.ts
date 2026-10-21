import { fontFamilyStack, isSafeFontStack, loadWebFont } from './load-web-font';

type TRgb = { r: number; g: number; b: number };

const hexToRgb = (hex: string): TRgb | null => {
    let h = hex.trim().replace(/^#/, '');
    // CSS shorthand (#f00) — expand per digit, matching what the CSS engine
    // would accept if the value were assigned to a custom property directly.
    if (/^[0-9a-f]{3}$/i.test(h)) h = [...h].map(c => c + c).join('');
    if (!/^[0-9a-f]{6}$/i.test(h)) return null;
    const n = parseInt(h, 16);
    // eslint-disable-next-line no-bitwise
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

const mix = (a: TRgb, b: TRgb, weight: number): TRgb => ({
    r: Math.round(a.r + (b.r - a.r) * weight),
    g: Math.round(a.g + (b.g - a.g) * weight),
    b: Math.round(a.b + (b.b - a.b) * weight),
});

const rgbStr = (c: TRgb) => `rgb(${c.r}, ${c.g}, ${c.b})`;

/** WCAG relative luminance, 0..1 — perceptual, so dark blues rank darker than greens. */
const relativeLuminance = (c: TRgb): number => {
    const lin = (v: number) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
};

/**
 * Lifts a colour to a minimum relative luminance by mixing toward white
 * (binary search on the mix weight — luminance is monotonic in it). Colours
 * already at/above the target are returned unchanged — only dark partner
 * colours get lifted, and only where the dark theme needs the contrast.
 */
const ensureMinLuminance = (c: TRgb, min: number): TRgb => {
    if (relativeLuminance(c) >= min) return c;
    const white: TRgb = { r: 255, g: 255, b: 255 };
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 20; i++) {
        const w = (lo + hi) / 2;
        if (relativeLuminance(mix(c, white, w)) < min) lo = w;
        else hi = w;
    }
    return mix(c, white, hi);
};

let brand_color_style_el: HTMLStyleElement | null = null;

// Last colour successfully applied by applyPrimaryColor. Unlike the bot, the
// trader never writes --brand-primary onto the root element (champion's
// theme-scoped declarations would beat it anyway — the injected stylesheet
// above carries the visuals), so non-DOM consumers like the letter-badge
// favicon read the applied colour from here instead of a CSS variable.
let applied_brand_color: string | null = null;

/** The colour last applied by applyPrimaryColor, or null before any call. */
export function getAppliedBrandColor(): string | null {
    return applied_brand_color;
}

// Chrome scopes: the legacy top bar (`.header`), the AppV2 account area
// (`.account-header`), the desktop sidebar (`.sidebar`) and the mobile bottom
// navigation (`.bottom-nav-container`) take the partner colour directly.
const BRAND_SCOPES = ['.header', '.account-header', '.sidebar', '.bottom-nav-container'];

// Dark surfaces sit around 1.5% relative luminance; a partner colour below
// this floor is lifted (dark theme only) so buttons/accents stay visible.
// Stock Deriv red (~0.26) and any mid/bright colour pass through unchanged.
const DARK_THEME_MIN_LUMINANCE = 0.25;

// Stock Quill colours baked into the vendored theme and SVG glyphs — the
// recolouring selectors in brandCss match on these exact attribute values.
const STOCK_CORAL_HEX = '#ff444f';
const STOCK_EMERALD_HEX = '#00c390';
const STOCK_CHERRY_HEX = '#de0040';
const STOCK_CHERRY_RGB: TRgb = { r: 222, g: 0, b: 64 }; // = STOCK_CHERRY_HEX

// Mix weights mirroring the stock theme's derivations: button hover darkens
// the base colour, trade buy/sell tile backgrounds darken it slightly.
const BUTTON_HOVER_DARKEN = 0.24;
const TRADE_BG_DARKEN = 0.1;

// Quill core ladder steps — mix weight toward white (tints), toward black
// (shades), and opacity steps. Identical for every scale.
const TINTS: Record<number, number> = { 75: 0.94, 100: 0.88, 200: 0.74, 300: 0.6, 400: 0.46, 500: 0.32, 600: 0.16 };
const SHADES: Record<number, number> = { 800: 0.12, 900: 0.24, 1000: 0.36, 1100: 0.48, 1200: 0.6, 1300: 0.72, 1400: 0.84 };
const ALPHAS: Record<number, number> = { 75: 0.02, 100: 0.04, 200: 0.08, 300: 0.16, 400: 0.24, 500: 0.32, 600: 0.48, 700: 0.64, 800: 0.8 };

const buildBrandDecls = (rgb: TRgb, secondary: TRgb) => {
    const color = rgbStr(rgb);
    const white: TRgb = { r: 255, g: 255, b: 255 };
    const black: TRgb = { r: 0, g: 0, b: 0 };

    const decls: string[] = [];
    decls.push(`--brand-primary: ${color} !important`);
    // The BrandLogo letter badge + header accents read this token.
    decls.push(`--brand-red-coral: ${color} !important`);
    // Champion maps the sidebar/bottom-nav active accent to --brand-danger.
    // Only the accent token is remapped (and only inside the chrome scopes) —
    // NOT --brand-danger itself, which drives error states.
    decls.push(`--color-nav-item-active: ${color} !important`);
    // The header Log in/Sign up buttons read --color-button-primary-*, which
    // the theme declares as var(--brand-primary) — resolved eagerly at the
    // theme root (stock red), so the scoped --brand-primary above never
    // reaches them. Re-declare the resolved tokens inside the scopes.
    decls.push(`--color-button-primary-bg: ${color} !important`);
    decls.push(`--color-button-primary-hover: ${rgbStr(mix(rgb, black, BUTTON_HOVER_DARKEN))} !important`);
    // quill-ui Buttons read --component-button-* tokens, which base2.css declares
    // at :root against the STOCK core ladders (var() in a custom property
    // resolves at the declaring element, so re-declared ladders elsewhere never
    // reach them). Re-declaring the same token chains alongside the ladders
    // makes them re-resolve locally — coral covers chrome buttons (e.g. the
    // header Log in), buy/sell cover the trade purchase buttons (needed for the
    // dark-theme override, whose ladders live on body.theme--dark, not :root).
    const componentButtonTokens = (name: string, scale: string): string[] => [
        `--component-button-bg-${name}-primary-default: var(--core-color-solid-${scale}-700) !important`,
        `--component-button-bg-${name}-primary-hover: var(--core-color-solid-${scale}-800) !important`,
        `--component-button-bg-${name}-primary-active: var(--core-color-solid-${scale}-900) !important`,
        `--component-button-bg-${name}-primary-expand: var(--core-color-solid-${scale}-900) !important`,
        `--component-button-bg-${name}-primary-loading: var(--core-color-solid-${scale}-900) !important`,
        ...['secondary', 'tertiary'].flatMap(variant => [
            `--component-button-bg-${name}-${variant}-hover: var(--core-color-opacity-${scale}-100) !important`,
            `--component-button-bg-${name}-${variant}-active: var(--core-color-opacity-${scale}-200) !important`,
            `--component-button-bg-${name}-${variant}-expand: var(--core-color-opacity-${scale}-200) !important`,
            `--component-button-bg-${name}-${variant}-loading: var(--core-color-opacity-${scale}-200) !important`,
            `--component-button-icon-${name}-${variant}: var(--core-color-solid-${scale}-700) !important`,
            `--component-button-label-color-${name}-${variant}: var(--core-color-solid-${scale}-700) !important`,
        ]),
        `--component-button-border-color-${name}: var(--core-color-solid-${scale}-700) !important`,
    ];
    decls.push(...componentButtonTokens('coral', 'coral'));

    const ladder = (scale: string, base: TRgb): string[] => [
        ...Object.entries(TINTS).map(
            ([step, w]) => `--core-color-solid-${scale}-${step}: ${rgbStr(mix(base, white, w))} !important`
        ),
        `--core-color-solid-${scale}-700: ${rgbStr(base)} !important`,
        ...Object.entries(SHADES).map(
            ([step, w]) => `--core-color-solid-${scale}-${step}: ${rgbStr(mix(base, black, w))} !important`
        ),
        ...Object.entries(ALPHAS).map(
            ([step, a]) => `--core-color-opacity-${scale}-${step}: rgba(${base.r}, ${base.g}, ${base.b}, ${a}) !important`
        ),
    ];

    // Chrome: Quill coral (Deriv red) ladder re-derived from the chosen colour,
    // for the header/sidebar buttons and accents.
    decls.push(...ladder('coral', rgb));

    // Trade UI (global): Rise/Buy runs on the quill emerald ladder and Fall/Sell
    // on the cherry ladder. Rise takes the partner's primary colour; Fall takes
    // the secondary colour the partner picked in the App Builder.
    //
    // Fall used to be derived as rotateHue(primary, 180). That produced colours
    // with no relationship to the brand — a purple primary gave a lime-green
    // Fall — and collapsed entirely for grey/black/white primaries, where hue is
    // undefined and Rise/Fall came out identical. An explicit second colour
    // replaces the guesswork; callers that have none pass STOCK_CHERRY_RGB, so
    // Fall always reads as a deliberate "sell".
    //
    // The semantic red/green scales (profit/loss numbers, error states) are
    // deliberately untouched.
    const rise = rgb;
    const fall = secondary;
    const trade_decls = [
        ...ladder('emerald', rise),
        ...ladder('cherry', fall),
        ...componentButtonTokens('buy', 'emerald'),
        ...componentButtonTokens('sell', 'cherry'),
    ];
    // Champion's own trade tokens (segmented-control labels, chart buy/sell
    // markers) — resolved eagerly at the theme root, so re-declare them.
    trade_decls.push(`--color-trade-buy: ${rgbStr(rise)} !important`);
    trade_decls.push(`--color-trade-buy-bg: ${rgbStr(mix(rise, black, TRADE_BG_DARKEN))} !important`);
    trade_decls.push(`--color-trade-sell: ${rgbStr(fall)} !important`);
    trade_decls.push(`--color-trade-sell-bg: ${rgbStr(mix(fall, black, TRADE_BG_DARKEN))} !important`);
    trade_decls.push(`--color-trade-sell-text: ${rgbStr(fall)} !important`);

    return { color, decls, trade_decls, rise, fall };
};

// Quill icons bake colours into SVG fill/stroke attributes. Deriv red
// (STOCK_CORAL_HEX) recolours only inside the chrome scopes (e.g. the header
// logo); the emerald and cherry trade glyphs recolour globally to match the
// derived rise/fall colours. `prefix` scopes a whole rule set to the dark
// theme (body carries .theme--dark), whose higher specificity beats the
// unprefixed light rules.
const brandCss = (built: ReturnType<typeof buildBrandDecls>, prefix = ''): string => {
    const { color, decls, trade_decls, rise, fall } = built;
    const scoped = (s: string) => (prefix ? `body${prefix} ${s}` : s);
    const scope_selector = BRAND_SCOPES.map(scoped).join(', ');
    const trade_selector = prefix ? `body${prefix}, body${prefix} *` : ':root, body, body *';
    const svg_fill = BRAND_SCOPES.map(s => `${scoped(s)} [fill='${STOCK_CORAL_HEX}' i]`).join(', ');
    const svg_stroke = BRAND_SCOPES.map(s => `${scoped(s)} [stroke='${STOCK_CORAL_HEX}' i]`).join(', ');
    const trade_svg = (attr: string, hex: string, c: TRgb) =>
        `${prefix ? `body${prefix} ` : ''}[${attr}='${hex}' i] { ${attr}: ${rgbStr(c)} !important; }`;
    return (
        `${scope_selector} { ${decls.join('; ')}; }\n` +
        `${trade_selector} { ${trade_decls.join('; ')}; }\n` +
        `${svg_fill} { fill: ${color} !important; }\n` +
        `${svg_stroke} { stroke: ${color} !important; }\n` +
        `${trade_svg('fill', STOCK_EMERALD_HEX, rise)}\n` +
        `${trade_svg('stroke', STOCK_EMERALD_HEX, rise)}\n` +
        `${trade_svg('fill', STOCK_CHERRY_HEX, fall)}\n` +
        `${trade_svg('stroke', STOCK_CHERRY_HEX, fall)}`
    );
};

/**
 * Applies the partner's brand colours.
 *
 * `color` drives the chrome (header, sidebar, nav) and the Rise/Buy side of the
 * trade UI. `secondary` drives the Fall/Sell side; omit it (or pass an
 * unparseable value) and Fall falls back to the stock cherry sell red, which is
 * what every project created before the secondary colour existed does.
 */
export function applyPrimaryColor(color: string, secondary?: string): void {
    const rgb = hexToRgb(color);
    if (!rgb) {
        // This runtime call is the ONLY path carrying the partner colour, so a
        // rejected value means a fully unbranded app — say so instead of
        // failing silently.
        console.warn(`Ignoring invalid brand primary colour ${JSON.stringify(color)} — expected hex (#RGB or #RRGGBB).`);
        return;
    }

    // An invalid secondary degrades to stock cherry rather than rejecting the
    // whole call: the primary colour is still worth applying, and a partner who
    // never set a secondary is the normal case, not an error.
    const secondary_rgb = (secondary ? hexToRgb(secondary) : null) ?? STOCK_CHERRY_RGB;
    if (secondary && !hexToRgb(secondary)) {
        console.warn(
            `Ignoring invalid brand secondary colour ${JSON.stringify(secondary)} — expected hex (#RGB or #RRGGBB).`
        );
    }

    applied_brand_color = color;

    if (!brand_color_style_el) {
        brand_color_style_el = document.createElement('style');
        brand_color_style_el.setAttribute('data-brand-color', '');
        document.head.appendChild(brand_color_style_el);
    }

    let css = brandCss(buildBrandDecls(rgb, secondary_rgb));
    // Dark theme: a too-dark partner colour disappears against dark surfaces
    // (navy Buy button on a near-black page) — re-derive everything from a
    // lightness-lifted base, scoped to body.theme--dark. A partner-chosen
    // secondary gets the same treatment: a near-black Fall button is just as
    // invisible. Stock cherry is exempt — it sits below the floor but is Deriv's
    // own sell red, legible on dark by design, so lifting it would emit a dark
    // block for every app that never set a secondary.
    const dark_rgb = ensureMinLuminance(rgb, DARK_THEME_MIN_LUMINANCE);
    const dark_secondary =
        secondary_rgb === STOCK_CHERRY_RGB
            ? secondary_rgb
            : ensureMinLuminance(secondary_rgb, DARK_THEME_MIN_LUMINANCE);
    if (dark_rgb !== rgb || dark_secondary !== secondary_rgb) {
        css += `\n${brandCss(buildBrandDecls(dark_rgb, dark_secondary), '.theme--dark')}`;
    }
    brand_color_style_el.textContent = css;
}

/**
 * Loads the chosen web font and applies it app-wide.
 *
 * Unlike the bot (whose stylesheets consume --brand-font-primary), the vendored
 * DTrader styles hardcode their font stacks, so setting the variable alone has
 * no visible effect. Inject an override stylesheet as well — icons are SVG and
 * the chart renders to canvas, so a blanket font override is safe here.
 *
 * Because the family lands in a stylesheet rather than a CSSOM property (where
 * an invalid value would simply be dropped), it is validated first: the live
 * App Builder preview feeds this from a postMessage, so an unchecked value
 * would let the sender append arbitrary CSS rules.
 */
let brand_font_style_el: HTMLStyleElement | null = null;
export function applyBrandFont(family: string): void {
    const stack = fontFamilyStack(family);
    if (!isSafeFontStack(stack)) {
        console.warn(`Ignoring invalid brand font ${JSON.stringify(family)} — expected a CSS font-family list.`);
        return;
    }
    loadWebFont(family);
    document.documentElement.style.setProperty('--brand-font-primary', stack);
    if (!brand_font_style_el) {
        brand_font_style_el = document.createElement('style');
        brand_font_style_el.setAttribute('data-brand-font', '');
        document.head.appendChild(brand_font_style_el);
    }
    brand_font_style_el.textContent = `body, body * { font-family: ${stack} !important; }`;
}
