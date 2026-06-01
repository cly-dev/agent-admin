import { AdminUserController_login } from '@/services/admin-user';
import type { AuthUser, LoginAdminUserResponse } from '@/types/admin-user';
import { formatAppMessage } from '@/utils/intl-message';

export const AUTH_STORAGE_KEY = 'agent-admin-authenticated';
const ACCESS_TOKEN_STORAGE_KEY = 'agent-admin-access-token';
const AUTH_USER_STORAGE_KEY = 'agent-admin-auth-user';

export type { AuthUser };
export type LoginResponse = LoginAdminUserResponse;

type AuthSnapshot = {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
};

type ErrorWithMessage = {
  message?: string;
  data?: {
    message?: string | string[];
  };
};

const getStorage = (): Storage | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
};

const parseAuthUser = (rawUser: string | null): AuthUser | null => {
  if (!rawUser) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(rawUser);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'id' in parsed &&
      'email' in parsed &&
      'username' in parsed
    ) {
      return parsed as AuthUser;
    }
    return null;
  } catch {
    return null;
  }
};

const getSnapshotFromStorage = (): AuthSnapshot => {
  const storage = getStorage();
  if (!storage) {
    return {
      accessToken: null,
      user: null,
      isAuthenticated: false,
    };
  }

  const accessToken = storage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  const user = parseAuthUser(storage.getItem(AUTH_USER_STORAGE_KEY));
  const isAuthenticated = storage.getItem(AUTH_STORAGE_KEY) === 'true' && Boolean(accessToken);
  return {
    accessToken,
    user,
    isAuthenticated,
  };
};

let inMemorySnapshot: AuthSnapshot = getSnapshotFromStorage();

export const isAuthenticated = (): boolean => {
  return inMemorySnapshot.isAuthenticated;
};

const setAuthenticated = (authenticated: boolean): void => {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(AUTH_STORAGE_KEY, authenticated ? 'true' : 'false');
};

const normalizeErrorMessage = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return formatAppMessage('auth.signInFailed');
  }

  const errorWithMessage = error as ErrorWithMessage;
  const message = errorWithMessage.data?.message ?? errorWithMessage.message;
  if (Array.isArray(message)) {
    return message.join(', ');
  }
  if (typeof message === 'string' && message.trim()) {
    return message;
  }
  return formatAppMessage('auth.signInFailed');
};

const persistSession = (payload: LoginResponse): void => {
  const storage = getStorage();
  inMemorySnapshot = {
    accessToken: payload.accessToken,
    user: payload.user,
    isAuthenticated: true,
  };
  if (storage) {
    storage.setItem(ACCESS_TOKEN_STORAGE_KEY, payload.accessToken);
    storage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(payload.user));
  }
  setAuthenticated(true);
};

export const getAccessToken = (): string | null => {
  if (!inMemorySnapshot.accessToken) {
    inMemorySnapshot = getSnapshotFromStorage();
  }
  return inMemorySnapshot.accessToken;
};

export const getAuthSnapshot = (): AuthSnapshot => {
  if (!inMemorySnapshot.accessToken && !inMemorySnapshot.user && !inMemorySnapshot.isAuthenticated) {
    inMemorySnapshot = getSnapshotFromStorage();
  }
  return inMemorySnapshot;
};

export const setAuthSession = (payload: LoginResponse): void => {
  persistSession(payload);
};

export const clearAuthSession = (): void => {
  const storage = getStorage();
  inMemorySnapshot = {
    accessToken: null,
    user: null,
    isAuthenticated: false,
  };
  if (storage) {
    storage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    storage.removeItem(AUTH_USER_STORAGE_KEY);
  }
  setAuthenticated(false);
};

export const signIn = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const normalizedEmail = email.trim();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      throw new Error(formatAppMessage('auth.credentialsRequired'));
    }

    const payload = await AdminUserController_login({
      email: normalizedEmail,
      password: normalizedPassword,
    });

    if (!payload?.accessToken) {
      throw new Error(formatAppMessage('auth.tokenMissing'));
    }

    persistSession(payload);
    return payload;
  } catch (error: unknown) {
    throw new Error(normalizeErrorMessage(error));
  }
};

export const signOut = async (): Promise<void> => {
  try {
    clearAuthSession();
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error(formatAppMessage('auth.signOutFailed'));
  }
};
