/**
 * Local Lottie animations for the trade-type guide.
 *
 * Upstream DTrader fetched these at runtime from `/public/videos/<key>_mobile.lottie`
 * via `getUrlBase`, which only resolves on a Deriv-hosted domain. A partner app
 * assembled from this template is served from its own origin, so the files ship
 * with the bundle instead: each import below is emitted as a hashed asset and
 * resolved by the bundler, so no request ever leaves for a Deriv domain.
 *
 * Keys are the lowercased `contract_type` strings that
 * `getContractDescription` passes to <VideoFragment/> — either a
 * `CONTRACT_LIST` entry (e.g. 'Accumulators') or one half of a slash-separated
 * pair (e.g. 'Matches/Differs' -> 'matches', 'differs').
 */
import accumulators from '@trader/public/videos/accumulators_mobile.lottie';
import differs from '@trader/public/videos/differs_mobile.lottie';
import even from '@trader/public/videos/even_mobile.lottie';
import fall from '@trader/public/videos/fall_mobile.lottie';
import higher from '@trader/public/videos/higher_mobile.lottie';
import lower from '@trader/public/videos/lower_mobile.lottie';
import matches from '@trader/public/videos/matches_mobile.lottie';
import multipliers_down from '@trader/public/videos/multipliers_down_mobile.lottie';
import multipliers_up from '@trader/public/videos/multipliers_up_mobile.lottie';
import no_touch from '@trader/public/videos/no_touch_mobile.lottie';
import odd from '@trader/public/videos/odd_mobile.lottie';
import over from '@trader/public/videos/over_mobile.lottie';
import rise from '@trader/public/videos/rise_mobile.lottie';
import touch from '@trader/public/videos/touch_mobile.lottie';
import turbos_down from '@trader/public/videos/turbos_down_mobile.lottie';
import turbos_up from '@trader/public/videos/turbos_up_mobile.lottie';
import under from '@trader/public/videos/under_mobile.lottie';
import vanillas_call from '@trader/public/videos/vanillas_call_mobile.lottie';
import vanillas_put from '@trader/public/videos/vanillas_put_mobile.lottie';

export const GUIDE_LOTTIE_SOURCES: Record<string, string> = {
    accumulators,
    differs,
    even,
    fall,
    higher,
    lower,
    matches,
    multipliers_down,
    multipliers_up,
    no_touch,
    odd,
    over,
    rise,
    touch,
    turbos_down,
    turbos_up,
    under,
    vanillas_call,
    vanillas_put,
};

/**
 * Resolve a bundled Lottie URL for a guide contract type. Returns undefined for
 * an unknown key so the caller can keep showing its loading placeholder rather
 * than handing an empty src to the player.
 */
export const getGuideLottieSource = (contract_type: string) =>
    GUIDE_LOTTIE_SOURCES[contract_type.toLowerCase()];
