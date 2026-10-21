import React, { lazy, Suspense } from 'react';

import SmartFallbackLoader from '@core/App/Components/Routes/smart-fallback-loader';
import { useDevice } from '@deriv-com/ui';

const V1Contract = lazy(() => import(/* webpackChunkName: "trader-contract-v1" */ '@trader/Modules/Contract'));
const V2ContractDetails = lazy(
    () => import(/* webpackChunkName: "trader-contract-details" */ '@trader/AppV2/Containers/ContractDetails')
);

const ContractDetailsSwitch = () => {
    const { isMobile } = useDevice();

    return <Suspense fallback={<SmartFallbackLoader />}>{isMobile ? <V2ContractDetails /> : <V1Contract />}</Suspense>;
};

export default ContractDetailsSwitch;
