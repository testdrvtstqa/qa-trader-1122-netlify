import { fontFamilyStack, isSafeFontStack } from '../load-web-font';

describe('fontFamilyStack', () => {
    it('wraps a supported family in a stack with system fallbacks', () => {
        expect(fontFamilyStack('Inter')).toBe(
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
        );
    });

    it('passes an unsupported family through unchanged', () => {
        // brand.config.json ships the full system stack as typography.font_family.primary,
        // so non-allowlisted values are a normal input, not an error.
        const systemStack = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        expect(fontFamilyStack(systemStack)).toBe(systemStack);
    });
});

describe('isSafeFontStack', () => {
    it.each([
        ['a bare family name', 'Inter'],
        ['a quoted family with spaces', "'Segoe UI'"],
        ['the brand.config.json system stack', "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"],
        ['a double-quoted family', '"Source Sans 3", sans-serif'],
    ])('accepts %s', (_label, stack) => {
        expect(isSafeFontStack(stack)).toBe(true);
    });

    it.each([
        // Each of these would escape the `font-family: <stack>` declaration and
        // append attacker-chosen CSS to the injected <style> element.
        ['a declaration terminator', 'Inter; background: url(https://evil.test/x)'],
        ['a rule terminator', 'Inter } body { display: none'],
        ['an opening brace', 'Inter { color: red'],
        ['a comment opener', 'Inter /* swallow the rest'],
        ['a comment closer', 'Inter */ }'],
        ['a url() reference', 'url(https://evil.test/leak)'],
        ['a CSS escape sequence', 'Inter\\3b  background: red'],
        ['a newline', 'Inter,\nsans-serif'],
        ['an empty string', ''],
        ['whitespace only', '   '],
    ])('rejects %s', (_label, stack) => {
        expect(isSafeFontStack(stack)).toBe(false);
    });
});
