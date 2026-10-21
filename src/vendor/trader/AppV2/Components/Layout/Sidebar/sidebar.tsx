import React from 'react';
import { useLocation } from 'react-router-dom';
import classNames from 'classnames';

import { Button, Flyout, Text } from '@deriv/components';

import BrandLogo from '@/components/brand-logo';
import {
    StandaloneCircleUserFillIcon,
    StandaloneCircleUserRegularIcon,
    StandaloneClockThreeFillIcon,
    StandaloneClockThreeRegularIcon,
    StandaloneMoonRegularIcon,
    StandaloneSunBrightRegularIcon,
} from '@deriv/quill-icons';
import { routes } from '@deriv/shared';
import { observer, useStore } from '@deriv/stores';
import { Localize, localize, useTranslations } from '@deriv-com/translations';

import PositionsDrawerTabs from '../PositionsDrawer/positions-drawer-tabs';

import AccountSelector from './account-selector';

type TSidebarItem = {
    id: string;
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    isActive: boolean;
    badge?: number;
    dataTestId?: string;
};

const Sidebar = observer(() => {
    const { ui, client, portfolio } = useStore();
    const { currentLang } = useTranslations();
    const { is_dark_mode_on, active_sidebar_flyout, setSidebarFlyout, closeSidebarFlyout } = ui;
    const { is_logged_in } = client;
    const { active_positions_count, onMount, onUnmount } = portfolio;
    const location = useLocation();
    const sidebar_ref = React.useRef<HTMLElement>(null);
    const is_on_index = location.pathname === routes.index;

    React.useEffect(() => {
        onMount();
        return () => onUnmount();
    }, [onMount, onUnmount]);

    React.useEffect(() => {
        if (active_sidebar_flyout && !is_on_index) {
            closeSidebarFlyout();
        }
    }, [is_on_index, active_sidebar_flyout, closeSidebarFlyout]);

    const isActiveRoute = (path: string) => {
        if (path === routes.index) {
            return location.pathname === routes.index;
        }
        return location.pathname.startsWith(path);
    };

    const handleThemeToggle = () => {
        ui.setDarkMode(!is_dark_mode_on);
    };

    const handleAccountToggle = () => {
        setSidebarFlyout(active_sidebar_flyout === 'account' ? null : 'account');
    };

    const handlePositionsToggle = () => {
        setSidebarFlyout(active_sidebar_flyout === 'positions' ? null : 'positions');
    };

    const closeFlyout = () => {
        closeSidebarFlyout();
    };

    // Main navigation items
    const isPositionsActive = active_sidebar_flyout === 'positions';

    const navigationItems: TSidebarItem[] = [
        {
            id: 'positions',
            icon: isPositionsActive ? (
                <StandaloneClockThreeFillIcon fill='var(--color-nav-item-active)' iconSize='sm' />
            ) : (
                <StandaloneClockThreeRegularIcon fill='var(--color-text-primary)' iconSize='sm' />
            ),
            label: localize('Positions'),
            onClick: handlePositionsToggle,
            isActive: isPositionsActive,
            badge: active_positions_count,
            dataTestId: 'dt_sidebar_positions',
        },
    ];

    // Utility items (bottom section)
    const isAccountActive = active_sidebar_flyout === 'account';

    const utilityItems = [
        {
            id: 'theme',
            icon: is_dark_mode_on ? (
                <StandaloneMoonRegularIcon fill='var(--color-text-primary)' iconSize='sm' />
            ) : (
                <StandaloneSunBrightRegularIcon fill='var(--color-text-primary)' iconSize='sm' />
            ),
            label: localize('Theme'),
            onClick: handleThemeToggle,
            isActive: false,
            dataTestId: 'dt_sidebar_theme',
        },
        {
            id: 'account',
            icon: isAccountActive ? (
                <StandaloneCircleUserFillIcon fill='var(--color-nav-item-active)' iconSize='sm' />
            ) : (
                <StandaloneCircleUserRegularIcon fill='var(--color-text-primary)' iconSize='sm' />
            ),
            label: localize('Account'),
            onClick: handleAccountToggle,
            isActive: isAccountActive,
            dataTestId: 'dt_sidebar_account',
        },
    ];

    const getFlyoutContent = () => {
        switch (active_sidebar_flyout) {
            case 'account':
                return {
                    title: <Localize i18n_default_text='Account' />,
                    content: <AccountSelector />,
                    footer: null,
                };
            case 'positions':
                return {
                    title: <Localize i18n_default_text='Positions' />,
                    content: <PositionsDrawerTabs />,
                    footer: null,
                };
            default:
                return null;
        }
    };

    const flyoutContent = React.useMemo(() => getFlyoutContent(), [active_sidebar_flyout, currentLang]);

    return (
        <React.Fragment>
            <aside
                ref={sidebar_ref}
                className={classNames('sidebar', {
                    sidebar__hidden: !isActiveRoute(routes.index),
                })}
                data-testid='dt_sidebar'
            >
                {/* Logo Section */}
                <div className='sidebar__header'>
                    <BrandLogo size={32} />
                </div>
                <div className='sidebar__separator' />
                {/* Main Navigation */}
                <nav className='sidebar__nav'>
                    <div className='sidebar__nav-main'>
                        {navigationItems.map(item => {
                            if (!is_logged_in) return null;

                            return (
                                <Button
                                    key={item.id}
                                    className={classNames('sidebar__item', {
                                        'sidebar__item--active': item.isActive,
                                    })}
                                    onClick={item.onClick}
                                    data-testid={item.dataTestId}
                                    aria-label={item.label}
                                    type='button'
                                >
                                    <Text className='sidebar__item-icon'>{item.icon}</Text>
                                    <Text className='sidebar__item-label'>{item.label}</Text>
                                    {item.badge !== undefined && item.badge > 0 && (
                                        <Text className='sidebar__item-badge'>{item.badge}</Text>
                                    )}
                                </Button>
                            );
                        })}
                    </div>
                    {/* Utility Section */}
                    <div className='sidebar__nav-utility'>
                        <div className='sidebar__separator' />
                        {utilityItems.map(item => {
                            const shouldShow = item.id === 'account' ? is_logged_in : true;

                            if (!shouldShow) return null;

                            return (
                                <Button
                                    key={item.id}
                                    className={classNames('sidebar__item', {
                                        'sidebar__item--active': item.isActive,
                                    })}
                                    onClick={item.onClick}
                                    data-testid={item.dataTestId}
                                    aria-label={item.label}
                                    type='button'
                                >
                                    <Text className='sidebar__item-icon'>{item.icon}</Text>
                                    <Text className='sidebar__item-label'>{item.label}</Text>
                                </Button>
                            );
                        })}
                    </div>
                </nav>
            </aside>

            {/* Single Flyout with conditional content - unmount when navigating away to avoid flash */}
            {is_on_index && (
                <Flyout
                    is_open={active_sidebar_flyout !== null}
                    onClose={closeFlyout}
                    title={flyoutContent?.title}
                    footer_content={flyoutContent?.footer}
                >
                    {flyoutContent?.content}
                </Flyout>
            )}
        </React.Fragment>
    );
});

export default Sidebar;
