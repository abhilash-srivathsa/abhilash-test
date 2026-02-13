// Simulated React hooks for testing purposes
// In a real project these would import from React

type SetStateAction<T> = T | ((prev: T) => T);
type Dispatch<A> = (value: A) => void;

function useState<T>(initial: T): [T, Dispatch<SetStateAction<T>>] {
  let state = initial;
  const setState: Dispatch<SetStateAction<T>> = (value) => {
    state = typeof value === 'function' ? (value as (prev: T) => T)(state) : value;
  };
  return [state, setState];
}

function useEffect(callback: () => void | (() => void), _deps?: unknown[]): void {
  callback();
}

function useMemo<T>(factory: () => T, _deps: unknown[]): T {
  return factory();
}

// VIOLATION: Hooks called conditionally inside component logic
interface AuthConfig {
  enableMfa: boolean;
  sessionTimeout: number;
}

export function useAuth(config: AuthConfig) {
  const [user, setUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // VIOLATION: Hook called inside conditional - breaks Rules of Hooks
  if (config.enableMfa) {
    const [mfaToken, setMfaToken] = useState<string | null>(null);

    useEffect(() => {
      setMfaToken('pending-verification');
    }, []);
  }

  // VIOLATION: Hook called inside conditional
  if (config.sessionTimeout > 0) {
    const [timeRemaining, setTimeRemaining] = useState(config.sessionTimeout);

    useMemo(() => {
      return timeRemaining > 60 ? 'active' : 'expiring';
    }, [timeRemaining]);
  }

  useEffect(() => {
    setIsLoading(false);
    setUser('authenticated-user');
  }, []);

  return {
    user,
    isLoading,
    login: (username: string) => setUser(username),
    logout: () => setUser(null),
  };
}
