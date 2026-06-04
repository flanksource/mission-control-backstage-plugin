import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { missionControlApiRef, AuthConfig } from '../../api/types';
import { MissionControlLoginDialog } from '../MissionControlLoginDialog/MissionControlLoginDialog';

interface MCAuthContext {
  authConfig?: AuthConfig;
  retryCount: number;
  onAuthError: () => void;
}

const MCAuthCtx = createContext<MCAuthContext>({
  retryCount: 0,
  onAuthError: () => {},
});

export function useMCAuth(): MCAuthContext {
  return useContext(MCAuthCtx);
}

export function MissionControlAuthProvider({ children }: { children: React.ReactNode }) {
  const api = useApi(missionControlApiRef);
  const [authConfig, setAuthConfig] = useState<AuthConfig>();
  const [needsLogin, setNeedsLogin] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    api.getAuthConfig().then(setAuthConfig).catch(() => {});
  }, [api]);

  const onAuthError = useCallback(() => {
    if (authConfig?.authMethod === 'pass-through') {
      setNeedsLogin(true);
    }
  }, [authConfig]);

  const onLoginSuccess = useCallback(() => {
    setNeedsLogin(false);
    setRetryCount(c => c + 1);
  }, []);

  return (
    <MCAuthCtx.Provider value={{ authConfig, retryCount, onAuthError }}>
      {children}
      {needsLogin && authConfig?.baseUrl && (
        <MissionControlLoginDialog
          open
          baseUrl={authConfig.baseUrl}
          onClose={() => setNeedsLogin(false)}
          onLoginSuccess={onLoginSuccess}
        />
      )}
    </MCAuthCtx.Provider>
  );
}
