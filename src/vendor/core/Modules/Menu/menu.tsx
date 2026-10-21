import React from 'react';
import { Redirect, useHistory } from 'react-router-dom';
import classNames from 'classnames';

import { useMobileBridge } from '@deriv/api';
import { Text, ToggleSwitch } from '@deriv/components';
import {
    StandaloneMoonRegularIcon,
    StandaloneRightFromBracketRegularIcon,
    StandaloneSunBrightRegularIcon,
} from '@deriv/quill-icons';
import { routes } from '@deriv/shared';
import { observer, useStore } from '@deriv/stores';
import { useTranslations } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';

import MenuLink from '@core/App/Components/Layout/Header/menu-link';

const MenuPage = observer(() => {
    const history = useHistory();
    const { isMobile } = useDevice();
    const { sendBridgeEvent, isMobileApp } = useMobileBridge();
    const { ui, client } = useStore();
    const { is_dark_mode_on: is_dark_mode, setDarkMode: toggleTheme } = ui;
    const { is_logged_in, logout: logoutClient } = client;
    const { localize } = useTranslations();

    const handleLogout = React.useCallback(async () => {
        try {
            await sendBridgeEvent('trading:back', async () => {
                await logoutClient();
            });
            history.push(routes.index);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Logout failed:', error);
        }
    }, [logoutClient, sendBridgeEvent, history]);

    if (!isMobile) return <Redirect to={routes.index} />;

    return (
        <div className='menu-page'>
            {/* Main menu view */}
            <div className='menu-page__main'>
                <div className='header__menu-mobile-body-wrapper'>
                    {/* Settings Section */}
                    <div className='header__menu-section'>
                        <div className='header__menu-section-header'>
                            <Text className='header__menu-section-title' size='xsm' weight='bold'>
                                {localize('Settings')}
                            </Text>
                        </div>
                        <div className='menu-page__item' onClick={() => toggleTheme(!is_dark_mode)}>
                            <div className={classNames('header__menu-mobile-link')}>
                                {is_dark_mode ? (
                                    <StandaloneSunBrightRegularIcon
                                        className='header__menu-mobile-link-icon'
                                        iconSize='sm'
                                        fill='var(--color-text-primary)'
                                    />
                                ) : (
                                    <StandaloneMoonRegularIcon
                                        className='header__menu-mobile-link-icon'
                                        iconSize='sm'
                                        fill='var(--color-text-primary)'
                                    />
                                )}
                                <div className='header__menu-mobile-link-text' onClick={e => e.preventDefault()}>
                                    <Text size='s'>
                                        {is_dark_mode ? localize('Light theme') : localize('Dark theme')}
                                    </Text>
                                    <div>
                                        <ToggleSwitch
                                            id='dt_menu_page_theme_toggler'
                                            handleToggle={() => toggleTheme(!is_dark_mode)}
                                            is_enabled={is_dark_mode}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Log out */}
                    {is_logged_in && !isMobileApp && (
                        <div className='menu-page__item header__menu-logout' onClick={handleLogout}>
                            <MenuLink
                                icon={
                                    <StandaloneRightFromBracketRegularIcon
                                        iconSize='sm'
                                        fill='var(--color-text-danger)'
                                    />
                                }
                                text={localize('Log out')}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

MenuPage.displayName = 'MenuPage';

export default MenuPage;
