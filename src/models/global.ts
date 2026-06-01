// 全局共享数据示例
import { DEFAULT_NAME } from '@/constants';
import {
  clearAuthSession,
  getAuthSnapshot,
  setAuthSession,
  type AuthUser,
  type LoginResponse,
} from '@/services/auth/user';
import { useEffect, useState } from 'react';

const useUser = () => {
  const snapshot = getAuthSnapshot();
  const [name, setName] = useState<string>(snapshot.user?.username ?? DEFAULT_NAME);
  const [accessToken, setAccessToken] = useState<string | null>(snapshot.accessToken);
  const [user, setUser] = useState<AuthUser | null>(snapshot.user);

  const restoreLoginSession = (): void => {
    const latestSnapshot = getAuthSnapshot();
    setAccessToken(latestSnapshot.accessToken);
    setUser(latestSnapshot.user);
    setName(latestSnapshot.user?.username ?? DEFAULT_NAME);
  };

  useEffect(() => {
    restoreLoginSession();
  }, []);

  const saveLoginSession = (payload: LoginResponse): void => {
    setAuthSession(payload);
    restoreLoginSession();
  };

  const clearLoginSession = (): void => {
    clearAuthSession();
    setAccessToken(null);
    setUser(null);
    setName(DEFAULT_NAME);
  };

  return {
    name,
    setName,
    accessToken,
    user,
    isAuthenticated: Boolean(accessToken),
    saveLoginSession,
    clearLoginSession,
    restoreLoginSession,
  };
};

export default useUser;
