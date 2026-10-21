import { useMobileBridge } from '@deriv/api';
import { getOnboardingUrl } from '@deriv/shared';
import { observer, useStore } from '@deriv/stores';
import { ActionSheet, Modal, Text } from '@deriv-com/quill-ui';
import { Localize } from '@deriv-com/translations';

const TryRealModal = observer(() => {
    const { ui, common } = useStore();
    const { is_try_real_modal_visible, toggleTryRealModal, is_mobile } = ui;
    const { sendBridgeEvent } = useMobileBridge();

    const onClose = () => toggleTryRealModal(false);

    const handleCreateRealAccount = () => {
        // New tab: onboarding is on the Deriv domain, so navigating the current tab
        // would drop the trading session. Close the modal either way so the app
        // isn't left behind a dialog the user has finished with.
        sendBridgeEvent('trading:account_creation', () => {
            window.open(getOnboardingUrl(common.current_language), '_blank', 'noopener,noreferrer');
        });
        toggleTryRealModal(false);
    };

    if (!is_try_real_modal_visible) return null;

    const sharedContent = {
        title: <Localize i18n_default_text='Complete your profile setup' />,
        message: <Localize i18n_default_text='Finish setting up your profile to continue.' />,
        primaryButtonText: <Localize i18n_default_text='Complete setup' />,
    };

    // Mobile Action Sheet
    if (is_mobile) {
        return (
            <ActionSheet.Root isOpen={is_try_real_modal_visible} onClose={onClose} expandable={false} position='left'>
                <ActionSheet.Portal showHandlebar shouldCloseOnDrag>
                    <ActionSheet.Content>
                        <Text size='lg' bold>
                            {sharedContent.title}
                        </Text>
                        <div style={{ marginTop: '16px' }}>
                            <Text size='sm'>{sharedContent.message}</Text>
                        </div>
                    </ActionSheet.Content>
                    <ActionSheet.Footer
                        alignment='vertical'
                        primaryButtonColor='coral'
                        primaryAction={{
                            content: sharedContent.primaryButtonText,
                            onAction: handleCreateRealAccount,
                        }}
                    />
                </ActionSheet.Portal>
            </ActionSheet.Root>
        );
    }

    // Desktop Modal
    return (
        <Modal
            isOpened={is_try_real_modal_visible}
            toggleModal={onClose}
            primaryButtonLabel={sharedContent.primaryButtonText}
            primaryButtonCallback={handleCreateRealAccount}
            buttonColor='coral'
        >
            <Modal.Header title={sharedContent.title} />
            <Modal.Body>
                <Text size='sm'>{sharedContent.message}</Text>
            </Modal.Body>
        </Modal>
    );
});

export default TryRealModal;
