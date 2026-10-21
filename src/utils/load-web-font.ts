// Web fonts offered by the App Builder "Customise" step. This rsbuild app has no
// build-time font bundling (unlike the Next.js templates' next/font), so the selected
// family is loaded at runtime from Google Fonts. The vendored DTrader SCSS hardcodes
// its font stacks, so applyBrandFont (apply-branding.ts) applies the family via an
// injected override stylesheet rather than the --brand-font-primary var alone.
const SUPPORTED_FONTS = new Set([
    'Inter',
    'Roboto',
    'Poppins',
    'DM Sans',
    'Lato',
    'Nunito',
    'Open Sans',
    'Montserrat',
    'Raleway',
    'Source Sans 3',
]);

const loaded = new Set<string>();

/** Injects a Google Fonts stylesheet for the given family (once). No-op for unknown families. */
export function loadWebFont(family: string): void {
    if (!SUPPORTED_FONTS.has(family) || loaded.has(family)) return;
    loaded.add(family);

    const id = `webfont-${family.replace(/\s+/g, '-').toLowerCase()}`;
    if (document.getElementById(id)) return;

    const googleName = family.replace(/\s+/g, '+');
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${googleName}:wght@400;500;600;700&display=swap`;
    document.head.appendChild(link);
}

/** Builds a CSS font-family stack for the family with sensible system fallbacks. */
export function fontFamilyStack(family: string): string {
    if (!SUPPORTED_FONTS.has(family)) return family;
    return `'${family}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;
}

// Characters that would let a font-family value break out of the
// `font-family: <stack>` declaration in the stylesheet applyBrandFont injects:
// `;` ends the declaration, `{`/`}` end the rule, `/*` and `*/` open and close
// comments, `\` starts a CSS escape, `url(` pulls in a remote reference, and a
// newline lets a payload read as a separate line.
const UNSAFE_CSS = /[;{}\\\n\r]|\/\*|\*\/|url\s*\(/i;

/**
 * True when a font-family value is safe to interpolate into a stylesheet.
 *
 * An allowlist check against SUPPORTED_FONTS is NOT enough on its own:
 * brand.config.json legitimately ships the full system stack as
 * typography.font_family.primary, so unlisted values reach the injected
 * stylesheet by design (fontFamilyStack passes them through). This validates
 * the string itself instead — a comma-separated list of names and quoted
 * strings can never need any of the characters above.
 */
export function isSafeFontStack(stack: string): boolean {
    if (!stack.trim()) return false;
    return !UNSAFE_CSS.test(stack);
}
