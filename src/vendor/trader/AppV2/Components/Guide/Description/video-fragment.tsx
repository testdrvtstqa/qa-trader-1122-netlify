import React from 'react';
import classNames from 'classnames';

import { Skeleton } from '@deriv/components';
import { useDevice } from '@deriv-com/ui';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

import { getGuideLottieSource } from '@trader/AppV2/Utils/guide-lottie-config';
import { CONTRACT_LIST } from '@trader/AppV2/Utils/trade-types-utils';

type TVideoFragment = {
    contract_type: string;
};

const VideoFragment = ({ contract_type }: TVideoFragment) => {
    const [is_loading, setIsLoading] = React.useState(true);
    const [dotLottie, setDotLottie] = React.useState<EventTarget | null>(null);

    const { isMobile } = useDevice();

    // Animations are bundled with the app rather than fetched from a Deriv domain.
    // Using mobile videos for both desktop and mobile as desktop-specific videos don't exist yet
    const lottie_src = React.useMemo(() => getGuideLottieSource(contract_type), [contract_type]);

    React.useEffect(() => {
        const onLoad = () => setIsLoading(false);

        if (dotLottie) dotLottie.addEventListener('load', onLoad);

        return () => {
            if (dotLottie) dotLottie.removeEventListener('load', onLoad);
        };
    }, [dotLottie]);

    return (
        <div
            className={classNames('video-fragment__wrapper', {
                'video-fragment__wrapper--accumulator':
                    contract_type.toLowerCase() === CONTRACT_LIST.ACCUMULATORS.toLowerCase(),
            })}
        >
            {is_loading && <Skeleton width={248} height={161} className='skeleton-video-loader' />}
            {lottie_src && (
                <DotLottieReact
                    autoplay
                    dotLottieRefCallback={
                        ((dotLottie: EventTarget | null) => setDotLottie(dotLottie)) as unknown as React.ComponentProps<
                            typeof DotLottieReact
                        >['dotLottieRefCallback']
                    }
                    src={lottie_src}
                    loop
                />
            )}
        </div>
    );
};

export default VideoFragment;
