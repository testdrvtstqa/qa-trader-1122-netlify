import React, { lazy, Suspense } from 'react';
import { useHistory } from 'react-router-dom';

import SmartFallbackLoader from '@core/App/Components/Routes/smart-fallback-loader';
import { routes } from '@deriv/shared';
import { observer } from '@deriv/stores';
import { useDevice } from '@deriv-com/ui';

import { TRADE_PANEL_TABS } from '@trader/AppV2/Components/AutomationPanel/automation-config';
import useIsAutomationEnabled from '@trader/AppV2/Hooks/useIsAutomationEnabled';
import { useTraderStore } from '@trader/Stores/useTraderStores';

const Automate = lazy(() => import(/* webpackChunkName: "trader-automate" */ '@trader/AppV2/Containers/Automate'));

// Guards the mobile-only `/automate` route: redirects to the trade page when the
// feature is off or on desktop (where automation is a panel tab). Mirrors `PositionsSwitch`.
const AutomateSwitch = observer(() => {
    const { isMobile } = useDevice();
    const { setActiveTradePanelTab } = useTraderStore();
    const history = useHistory();
    const { is_enabled: is_automation_enabled, is_ready: is_eu_status_ready } = useIsAutomationEnabled();

    React.useEffect(() => {
        if (!is_eu_status_ready) return;
        if (!is_automation_enabled) {
            history.replace(routes.index);
            return;
        }
        if (!isMobile) {
            setActiveTradePanelTab(TRADE_PANEL_TABS.AUTOMATION);
            history.replace(routes.index);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMobile, is_automation_enabled, is_eu_status_ready]);

    if (!isMobile) return null;
    if (!is_eu_status_ready) return <SmartFallbackLoader />;
    if (!is_automation_enabled) return null;

    return (
        <Suspense fallback={<SmartFallbackLoader />}>
            <Automate />
        </Suspense>
    );
});

export default AutomateSwitch;
