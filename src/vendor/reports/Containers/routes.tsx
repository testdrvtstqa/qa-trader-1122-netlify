import { observer, useStore } from '@deriv/stores';
import { RouteComponentProps, withRouter } from 'react-router';
import React from 'react';
import BinaryRoutes from '@reports/Components/Routes';
import ErrorComponent from '@reports/Components/Errors';
import { TRoutes } from '@reports/Types';

const Routes = observer(({ passthrough }: TRoutes & RouteComponentProps) => {
    const { client, common } = useStore();
    const { is_logged_in, is_logging_in } = client;
    const { error, has_error } = common;
    if (has_error) {
        return <ErrorComponent {...error} />;
    }

    return <BinaryRoutes is_logged_in={is_logged_in} is_logging_in={is_logging_in} passthrough={passthrough} />;
});

export default withRouter(Routes);
