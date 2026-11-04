import { createContext, useContext } from 'react';

export interface AuthState {
  isReady: boolean;
  showLoading: boolean;
  /** Replays the loading choreography when signing in from the auth page. */
  beginEntry: () => void;
}

export const AuthReadyContext = createContext<AuthState>({
  isReady: false,
  showLoading: true,
  beginEntry: () => {},
});

export const useAuthState = () => useContext(AuthReadyContext);

export const useAnimationsEnabled = () => {
  const { isReady, showLoading } = useContext(AuthReadyContext);
  return isReady && !showLoading;
};
