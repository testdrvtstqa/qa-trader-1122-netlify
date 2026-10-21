/**
 * deriv-api-v2#782: the socket URL used to be resolved synchronously from a
 * value minted once at boot, so a reconnect had nothing left to authorize
 * with. Resolving it is now an awaited round-trip per attempt, which is what
 * these guard — including the re-entrancy the await introduces.
 */
const mockGetCompleteWebSocketURL = jest.fn();

jest.mock(
    '@deriv/shared',
    () => ({
        getCompleteWebSocketURL: (...args: unknown[]) => mockGetCompleteWebSocketURL(...args),
        getAccountId: jest.fn(() => null),
        cloneObject: (value: unknown) => value,
        State: { set: jest.fn() },
    }),
    { virtual: true }
);

jest.mock(
    '@deriv/deriv-api/dist/DerivAPIBasic',
    () =>
        jest.fn().mockImplementation(() => ({
            onOpen: () => ({ subscribe: jest.fn() }),
            onMessage: () => ({ subscribe: jest.fn() }),
            onClose: () => ({ subscribe: jest.fn() }),
        })),
    { virtual: true }
);

jest.mock('../socket_cache', () => ({}), { virtual: true });
jest.mock('../api_middleware', () => jest.fn().mockImplementation(() => ({})), { virtual: true });

const OPEN = 1;
const CLOSED = 3;

class FakeWebSocket {
    static instances: FakeWebSocket[] = [];

    readyState = OPEN;

    constructor(public url: string) {
        FakeWebSocket.instances.push(this);
    }

    addEventListener = jest.fn();

    close = jest.fn(() => {
        this.readyState = CLOSED;
    });
}

type TBinarySocket = {
    init: (args: {
        options: { wsEvent: jest.Mock; onConnectionError?: jest.Mock };
        client: unknown;
    }) => void;
    openNewConnection: () => Promise<void>;
    closeAndOpenNewConnection: () => Promise<void>;
    close: () => void;
    isClose: () => boolean;
};

const loadSocketBase = (): { socket: TBinarySocket; wsEvent: jest.Mock; onConnectionError: jest.Mock } => {
    let socket: TBinarySocket;
    jest.isolateModules(() => {
        // The module is an IIFE singleton capturing its own socket state, so
        // each test needs its own copy.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        socket = require('../socket_base');
    });
    const wsEvent = jest.fn();
    const onConnectionError = jest.fn();
    socket!.init({ options: { wsEvent, onConnectionError }, client: {} });
    return { socket: socket!, wsEvent, onConnectionError };
};

describe('BinarySocketBase.openNewConnection', () => {
    beforeEach(() => {
        FakeWebSocket.instances = [];
        Object.assign(global, { WebSocket: FakeWebSocket });
        mockGetCompleteWebSocketURL.mockResolvedValue('wss://minted/first');
    });

    it('opens the socket with the URL the resolver returned', async () => {
        const { socket } = loadSocketBase();

        await socket.openNewConnection();

        expect(FakeWebSocket.instances).toHaveLength(1);
        expect(FakeWebSocket.instances[0].url).toBe('wss://minted/first');
    });

    it('resolves a new URL for a reconnect after the socket closed', async () => {
        const { socket } = loadSocketBase();
        mockGetCompleteWebSocketURL
            .mockResolvedValueOnce('wss://minted/first')
            .mockResolvedValueOnce('wss://minted/second');

        await socket.openNewConnection();
        FakeWebSocket.instances[0].readyState = CLOSED;
        await socket.openNewConnection();

        expect(mockGetCompleteWebSocketURL).toHaveBeenCalledTimes(2);
        expect(FakeWebSocket.instances).toHaveLength(2);
        expect(FakeWebSocket.instances[1].url).toBe('wss://minted/second');
    });

    it('opens exactly one socket when two triggers overlap an in-flight resolve', async () => {
        const { socket } = loadSocketBase();

        await Promise.all([socket.openNewConnection(), socket.openNewConnection()]);

        expect(FakeWebSocket.instances).toHaveLength(1);
        expect(mockGetCompleteWebSocketURL).toHaveBeenCalledTimes(1);
    });

    // An account switch reaches the socket layer through
    // closeAndOpenNewConnection. If it were to share the in-flight attempt, the
    // switch would silently keep the previous account's connection: that
    // attempt resolved its URL before the new account was selected.
    it('reconnects for an account switch that lands during an in-flight open', async () => {
        const { socket } = loadSocketBase();
        mockGetCompleteWebSocketURL
            .mockResolvedValueOnce('wss://minted/previous-account')
            .mockResolvedValueOnce('wss://minted/new-account');

        const in_flight = socket.openNewConnection();
        await socket.closeAndOpenNewConnection();
        await in_flight;

        expect(FakeWebSocket.instances).toHaveLength(2);
        expect(FakeWebSocket.instances[1].url).toBe('wss://minted/new-account');
    });

    it('reschedules instead of connecting when the URL cannot be resolved', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
        const { socket, wsEvent } = loadSocketBase();
        mockGetCompleteWebSocketURL.mockRejectedValue(new Error('mint failed'));

        await socket.openNewConnection();

        expect(FakeWebSocket.instances).toHaveLength(0);
        expect(wsEvent).toHaveBeenCalledWith('close');
    });

    // A failed mint never constructs a socket, so it never reaches the socket's
    // own `error` listener. Without feeding the same threshold itself, a
    // persistent mint failure would retry forever without ever telling the user.
    it('surfaces a connection error once the mint has failed three times', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
        const { socket, onConnectionError } = loadSocketBase();
        const mint_error = new Error('mint failed');
        mockGetCompleteWebSocketURL.mockRejectedValue(mint_error);

        await socket.openNewConnection();
        await socket.openNewConnection();
        expect(onConnectionError).not.toHaveBeenCalled();

        await socket.openNewConnection();

        expect(onConnectionError).toHaveBeenCalledWith(mint_error);
    });

    // The reconnect predicate, the `offline` listener, `cleanUp()` and an
    // account switch all run against this state after a mint that failed.
    it('reports no live socket, and closes without throwing, when the mint failed', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
        const { socket } = loadSocketBase();
        mockGetCompleteWebSocketURL.mockRejectedValue(new Error('mint failed'));

        await socket.openNewConnection();

        expect(socket.isClose()).toBe(true);
        expect(() => socket.close()).not.toThrow();
    });

    it('recovers on a later attempt once minting succeeds again', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
        const { socket } = loadSocketBase();
        mockGetCompleteWebSocketURL
            .mockRejectedValueOnce(new Error('mint failed'))
            .mockResolvedValueOnce('wss://minted/after-recovery');

        await socket.openNewConnection();
        await socket.openNewConnection();

        expect(FakeWebSocket.instances).toHaveLength(1);
        expect(FakeWebSocket.instances[0].url).toBe('wss://minted/after-recovery');
    });
});
