import React from 'react';
import { Joyride, STATUS, type EventData, type Step } from 'react-joyride';

import GuideTooltip from './guide-tooltip';
import STEPS from './steps-config';

type TGuideContainerProps = {
    should_run: boolean;
    onFinishGuide: () => void;
    custom_steps?: Step[]; // If provided, use these steps instead of the default mobile STEPS
};

const GuideContainer = ({ should_run, onFinishGuide, custom_steps }: TGuideContainerProps) => {
    const [step_index, setStepIndex] = React.useState(0);
    const all_steps = custom_steps ?? STEPS;

    // Drop steps whose target selector isn't in the DOM. Without this, Joyride
    // silently fails to start when the first step's target is absent — e.g. the
    // trade-types selector is hidden for clients in restricted account groups.
    const steps = React.useMemo(() => {
        if (!should_run) return all_steps;
        return all_steps.filter(step =>
            typeof step.target === 'string' ? !!document.querySelector(step.target) : true
        );
    }, [should_run, all_steps]);

    React.useEffect(() => {
        if (should_run && steps.length === 0) onFinishGuide();
    }, [should_run, steps.length, onFinishGuide]);

    const handleEvent = (data: EventData) => {
        const { status } = data;
        if (status === STATUS.FINISHED || status === STATUS.SKIPPED) onFinishGuide();
    };

    return (
        <Joyride
            continuous
            onEvent={handleEvent}
            run={should_run && steps.length > 0}
            scrollToFirstStep
            stepIndex={step_index}
            steps={steps}
            tooltipComponent={props => <GuideTooltip {...props} setStepIndex={setStepIndex} />}
            options={{
                // v2: disableCloseOnEsc / disableOverlayClose / disableScrolling /
                // showSkipButton / disableBeacon / spotlightPadding / floater arrow /
                // styles.options theming
                dismissKeyAction: false,
                overlayClickAction: false,
                skipScroll: true,
                skipBeacon: true,
                spotlightPadding: 0,
                spotlightRadius: 0,
                buttons: ['skip', 'primary'],
                arrowSize: 4,
                arrowBase: 8,
                arrowColor: 'var(--component-textIcon-normal-prominent)',
                overlayColor: 'var(--core-color-opacity-black-600)',
            }}
        />
    );
};

export default React.memo(GuideContainer);
