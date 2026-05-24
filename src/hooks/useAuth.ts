// Simulated React hooks for testing purposes
// In a real project these would import from React

type StateUpdater<T> = (prev: T) => T;
type Dispatch<T> = (value: T | StateUpdater<T>) => void;

function useState<T>(initial: T): [T, Dispatch<T>] {
  let state = initial;
  const setState: Dispatch<T> = (action) => {
    state = typeof action === 'function'
      ? (action as StateUpdater<T>)(state)
      : action;
  };
  return [state, setState];
}

function useEffect(callback: () => void | (() => void), _deps?: unknown[]): void {
  callback();
}

function useMemo<T>(factory: () => T, _deps: unknown[]): T {
  return factory();
}

type AuthConfig = Readonly<{
  enableMfa: boolean;
  sessionTimeout: number;
}>;

interface AuthState {
  user: string | null;
  isLoading: boolean;
  mfaToken: string | null;
  timeRemaining: number;
}

export function useAuth(config: AuthConfig) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    mfaToken: null,
    timeRemaining: config.sessionTimeout,
  });

  const sessionStatus = useMemo(
    () => (authState.timeRemaining > 60 ? 'active' : 'expiring'),
    [authState.timeRemaining],
  );

  useEffect(() => {
    setAuthState((prev: AuthState) => ({
      ...prev,
      isLoading: false,
      user: 'authenticated-user',
      mfaToken: config.enableMfa ? 'pending-verification' : null,
    }));
  }, []);

  return {
    user: authState.user,
    isLoading: authState.isLoading,
    mfaToken: authState.mfaToken,
    sessionStatus,
    login: (username: string) =>
      setAuthState((prev: AuthState) => ({ ...prev, user: username })),
    logout: () =>
      setAuthState((prev: AuthState) => ({ ...prev, user: null })),
  };
}
