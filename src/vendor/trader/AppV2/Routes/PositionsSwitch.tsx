import React, { lazy, Suspense } from 'react';
import { useHistory } from 'react-router-dom';

import SmartFallbackLoader from '@core/App/Components/Routes/smart-fallback-loader';
import { routes } from '@deriv/shared';
import { observer, useStore } from '@deriv/stores';
import { useDevice } from '@deriv-com/ui';

const Positions = lazy(() => import(/* webpackChunkName: "trader-positions" */ '@trader/AppV2/Containers/Positions'));

const PositionsSwitch = observer(() => {
    const { isMobile } = useDevice();
    const { ui } = useStore();
    const history = useHistory();

    React.useEffect(() => {
        if (!isMobile) {
            ui.setSidebarFlyout('positions');
            history.replace(routes.index);
        }
    }, [isMobile]);

    if (!isMobile) return null;

    return (
        <Suspense fallback={<SmartFallbackLoader />}>
            <Positions />
        </Suspense>
    );
});

export default PositionsSwitch;
