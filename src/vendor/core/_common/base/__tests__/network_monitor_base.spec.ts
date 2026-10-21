/**
 * deriv-api-v2#782: opening the socket now awaits a minted URL, so "there is
 * no socket yet" is a reachable state. The reconnect predicate has to treat it
 * as "reconnect" — reading it as "not closed" sends a request through a
 * `deriv_api` that does not exist, which throws inside the timer callback after
 * the timeout handle has already been cleared, so the retry schedule dies with
 * it and the socket never comes back.
 */
jest.mock('@deriv-com/translations', () => ({ localize: (text: string) => text }), { virtual: true });

const mockSocket: {
    init: jest.Mock;
    openNewConnection: jest.Mock;
    close: jest.Mock;
    isClose: jest.Mock;
    hasReadyState: jest.Mock;
    // Absent until `deriv_api` is built — mirroring the real proxy, which
    // resolves `send` to `undefined` while no socket exists.
    send?: unknown;
} = {
    init: jest.fn(),
    openNewConnection: jest.fn(),
    close: jest.fn(),
    isClose: jest.fn(() => false),
    hasReadyState: jest.fn(() => false),
    send: undefined,
};

jest.mock('../socket_base', () => mockSocket);

type TNetworkMonitor = {
    init: (socket_general_functions: unknown, fncUpdateUI: jest.Mock, client_store: unknown) => void;
    wsEvent: (event: string) => void;
};

const loadNetworkMonitor = (): TNetworkMonitor => {
    let monitor: TNetworkMonitor;
    jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        monitor = require('../network_monitor_base');
    });
    monitor!.init({}, jest.fn(), {});
    return monitor!;
};

describe('NetworkMonitorBase.reconnectAfter', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        mockSocket.isClose.mockReturnValue(false);
        mockSocket.send = undefined;
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('retries the connection when a failed attempt left no socket behind', () => {
        mockSocket.isClose.mockReturnValue(true);
        const monitor = loadNetworkMonitor();
        mockSocket.openNewConnection.mockClear();

        // What `openNewConnection` fires when the mint throws.
        monitor.wsEvent('close');
        jest.advanceTimersByTime(5000);

        expect(mockSocket.openNewConnection).toHaveBeenCalledTimes(1);
    });

    it('keeps rescheduling while the mint keeps failing', () => {
        mockSocket.isClose.mockReturnValue(true);
        const monitor = loadNetworkMonitor();
        mockSocket.openNewConnection.mockClear();

        for (let attempt = 0; attempt < 3; attempt++) {
            monitor.wsEvent('close');
            jest.advanceTimersByTime(5000);
        }

        expect(mockSocket.openNewConnection).toHaveBeenCalledTimes(3);
    });

    it('probes instead of reconnecting while a live socket is up', () => {
        mockSocket.send = jest.fn();
        const monitor = loadNetworkMonitor();
        mockSocket.openNewConnection.mockClear();

        monitor.wsEvent('close');
        jest.advanceTimersByTime(5000);

        expect(mockSocket.send).toHaveBeenCalledWith({ time: 1 });
        expect(mockSocket.openNewConnection).not.toHaveBeenCalled();
    });
});
