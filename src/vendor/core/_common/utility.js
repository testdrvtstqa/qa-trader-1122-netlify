/**
 * Creates a DOM element and adds any attributes to it.
 *
 * @param {String} tag_name: the tag to create, e.g. 'div', 'a', etc
 * @param {Object} attributes: all the attributes to assign, e.g. { id: '...', class: '...', html: '...', ... }
 * @return the created DOM element
 */
const createElement = (tag_name, attributes = {}) => {
    const el = document.createElement(tag_name);
    Object.keys(attributes).forEach(attr => {
        const value = attributes[attr];
        if (attr === 'text') {
            el.textContent = value;
        } else if (attr === 'html') {
            el.html(value);
        } else {
            el.setAttribute(attr, value);
        }
    });
    return el;
};

let static_hash;
const getStaticHash = () => {
    // Upstream's webpack entry is main.<hash>.js; the template's rsbuild entry
    // is index.<hash>.js. Match both and never throw — this feeds the
    // socket-cache key, so a null querySelector here used to break every
    // cacheable WS response (the UI stayed on loading skeletons).
    static_hash =
        static_hash ||
        (document.querySelector('script[src*="main"], script[src*="index"]')?.getAttribute('src') || '').split(
            '.'
        )[1] ||
        'static';
    return static_hash;
};

// TODO: [duplicate_code] - Move this to shared package
// eu countries to support
const eu_countries = [
    'it',
    'de',
    'fr',
    'lu',
    'gr',
    'mf',
    'es',
    'sk',
    'lt',
    'nl',
    'at',
    'bg',
    'si',
    'cy',
    'be',
    'ro',
    'hr',
    'pt',
    'pl',
    'lv',
    'ee',
    'cz',
    'fi',
    'hu',
    'dk',
    'se',
    'ie',
    'im',
    'gb',
    'mt',
];
// TODO: [duplicate_code] - Move this to shared package
// check if client is from EU
const isEuCountry = country => eu_countries.includes(country);
// countries where synthetics are not offered
const countries_without_synthetics = ['sg', 'de', 'gr', 'es', 'au', 'it', 'lu'];
// check if synthetics are offered based on country
const isSyntheticsUnavailable = country => countries_without_synthetics.includes(country);
// countries where binary options are blocked
const blocked_options_countries = ['au', 'fr'];
const isOptionsBlocked = country => blocked_options_countries.includes(country);
// countries where only multipliers are offered
const multipliers_only_countries = ['de', 'es', 'it', 'lu', 'gr', 'au', 'fr'];
const isMultipliersOnly = country => multipliers_only_countries.includes(country);

const getRegion = (landing_company_shortcode, residence) => {
    if (landing_company_shortcode === 'virtual') {
        return isEuCountry(residence) ? 'eu' : 'row';
    }
    return landing_company_shortcode === 'svg' ? 'row' : 'eu';
};

module.exports = {
    createElement,
    getStaticHash,
    isEuCountry,
    isOptionsBlocked,
    isSyntheticsUnavailable,
    isMultipliersOnly,
    getRegion,
};
