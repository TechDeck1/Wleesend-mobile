import { BASE_URL } from '@/config/api';
import { base64ToDataUri } from '@/services/profileService';

export function resolveProfileImage(path: string | null | undefined): string | null {
  const value = path?.trim();
  if (!value) return null;

  if (/^(data:|https?:\/\/|file:|content:)/i.test(value)) return value;
  if (value.startsWith('/9j/') || value.startsWith('iVBOR')) return base64ToDataUri(value);

  const base = BASE_URL.replace(/\/+$/, '');
  const normalized = value.replace(/\\/g, '/');

  const afterWwwroot = normalized.match(/(?:^|\/)wwwroot\/(.+)$/i);
  if (afterWwwroot) return `${base}/${afterWwwroot[1]}`;

  if (/^[A-Za-z]:\//.test(normalized)) return null;

  if (normalized.startsWith('/')) return `${base}${normalized}`;
  return `${base}/${normalized}`;
}

export const getInitials = (firstName?: string, lastName?: string) =>
  `${firstName?.trim()?.[0] ?? ''}${lastName?.trim()?.[0] ?? ''}`.toUpperCase();