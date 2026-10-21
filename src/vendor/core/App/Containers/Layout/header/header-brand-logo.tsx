import React from 'react';

import BrandLogo from '@/components/brand-logo';

/** Mobile header brand mark — the shared BrandLogo in the header wrapper. */
const HeaderBrandLogo = () => (
    <div className='header__logo' style={{ display: 'flex', alignItems: 'center', width: 'auto', minWidth: 0 }}>
        <BrandLogo size={32} />
    </div>
);

export default HeaderBrandLogo;
