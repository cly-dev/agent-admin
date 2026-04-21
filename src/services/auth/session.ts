export const AUTH_STORAGE_KEY = 'agent-admin-authenticated';

const getStorage = (): Storage | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
};

export const isAuthenticated = (): boolean => {
  const storage = getStorage();
  if (!storage) {
    return false;
  }

  return storage.getItem(AUTH_STORAGE_KEY) === 'true';
};

const setAuthenticated = (authenticated: boolean): void => {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(AUTH_STORAGE_KEY, authenticated ? 'true' : 'false');
};

export const signIn = async (username: string, password: string): Promise<void> => {
  try {
    const normalizedUsername = username.trim();
    const normalizedPassword = password.trim();

    if (!normalizedUsername || !normalizedPassword) {
      throw new Error('请输入用户名和密码');
    }

    setAuthenticated(true);
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error('登录失败，请稍后重试');
  }
};

export const signOut = async (): Promise<void> => {
  try {
    setAuthenticated(false);
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error('退出登录失败，请稍后重试');
  }
};
