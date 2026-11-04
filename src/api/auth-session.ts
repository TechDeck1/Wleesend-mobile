import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { AUTH_SESSION_STORAGE_KEY } from '@/constants/storage';

export type AuthUser = {
  userId: string;
  firstName: string;
  lastName: string;
  profilePic: string;
  phone: string;
  accountNumber: string;
  email: string;
  role: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

let cachedSession: AuthSession | null | undefined;
let webSession: string | null = null;
const sessionExpiredListeners = new Set<() => void>();

function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const session = value as Partial<AuthSession>;
  return (
    typeof session.token === 'string' &&
    session.token.length > 0 &&
    !!session.user &&
    typeof session.user.userId === 'string' &&
    typeof session.user.email === 'string' &&
    typeof session.user.firstName === 'string' &&
    typeof session.user.lastName === 'string' &&
    typeof session.user.profilePic === 'string' &&
    typeof session.user.phone === 'string' &&
    typeof session.user.accountNumber === 'string' &&
    typeof session.user.role === 'string'
  );
}

async function readSessionValue(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return webSession;
  }
  return SecureStore.getItemAsync(AUTH_SESSION_STORAGE_KEY);
}

async function writeSessionValue(value: string): Promise<void> {
  if (Platform.OS === 'web') {
    webSession = value;
    return;
  }
  await SecureStore.setItemAsync(AUTH_SESSION_STORAGE_KEY, value);
}

async function removeSessionValue(): Promise<void> {
  if (Platform.OS === 'web') {
    webSession = null;
    return;
  }
  await SecureStore.deleteItemAsync(AUTH_SESSION_STORAGE_KEY);
}

export async function getAuthSession(): Promise<AuthSession | null> {
  if (cachedSession !== undefined) {
    return cachedSession;
  }

  const serializedSession = await readSessionValue();
  if (!serializedSession) {
    cachedSession = null;
    return null;
  }

  let parsedSession: unknown;
  try {
    parsedSession = JSON.parse(serializedSession);
  } catch {
    throw new Error('The saved sign-in session is invalid. Sign in again.');
  }

  if (!isAuthSession(parsedSession)) {
    throw new Error('The saved sign-in session is invalid. Sign in again.');
  }

  cachedSession = parsedSession;
  return parsedSession;
}

export async function saveAuthSession(session: AuthSession): Promise<void> {
  await writeSessionValue(JSON.stringify(session));
  cachedSession = session;
}

export async function clearAuthSession(): Promise<void> {
  await removeSessionValue();
  cachedSession = null;
  for (const listener of sessionExpiredListeners) {
    listener();
  }
}

export function subscribeToSessionExpiration(listener: () => void): () => void {
  sessionExpiredListeners.add(listener);
  return () => sessionExpiredListeners.delete(listener);
}
