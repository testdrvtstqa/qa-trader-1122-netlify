/**
 * Shim for the components package's `utils/helper` module, which was not carried
 * over during the flatten of @deriv/components into src/vendor/components. Only
 * `getEnglishCharacters` is imported (by autocomplete.tsx); the implementation is
 * the original from @deriv/shared's string utils.
 */
export const getEnglishCharacters = (input: string): string =>
    input
        .normalize('NFD')
        .split('')
        .filter(char => /^[a-z ]*$/i.test(char))
        .join('');
