import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/config/api';

export type ProfileImageUploadResponse = {
  Image?: string | null;
  image?: string | null;
  message?: string | null;
  errorMessage?: string | null;
};

type ProgressInput = number | { loaded?: number; total?: number; progress?: number };

function toPercent(input: ProgressInput): number {
  if (typeof input === 'number') {
    // Some clients report 0..1, others 0..100.
    return Math.round(input <= 1 ? input * 100 : input);
  }
  if (typeof input.progress === 'number') return Math.round(input.progress * 100);
  if (input.loaded != null && input.total) return Math.round((input.loaded * 100) / input.total);
  return 0;
}

// Backend returns raw base64 (no prefix). Convert it to a data URI the <Image> can render.
export function base64ToDataUri(value: string): string {
  const trimmed = value.trim();
  if (/^(data:|https?:\/\/)/i.test(trimmed)) return trimmed;
  const mime = trimmed.startsWith('iVBOR') ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,${trimmed}`;
}

export async function uploadProfileImage(
  file: { uri: string; name: string; type: string },
  userId: string,
  onProgress: (progress: number) => void,
): Promise<string> {
  const form = new FormData();
  form.append('file', file as unknown as Blob);

  // Backend binds `string userId` from the query string, so it must go in the URL.
  const base = API_ENDPOINTS.user.profileImage;
  const separator = base.includes('?') ? '&' : '?';
  const url = `${base}${separator}userId=${encodeURIComponent(userId)}`;

  const response = await apiClient.post<ProfileImageUploadResponse | string, FormData>(
    url,
    form,
    { onUploadProgress: (event: ProgressInput) => onProgress(toPercent(event)) },
  );

  // Backend sends plain-string errors via BadRequest("...") in some cases.
  if (typeof response === 'string') {
    throw new Error(response || 'The photo upload failed.');
  }

  const image = response?.Image ?? response?.image;
  if (typeof image !== 'string' || !image.trim()) {
    throw new Error(
      response?.errorMessage || response?.message || 'The server did not return the updated profile image.',
    );
  }
  return base64ToDataUri(image);
}



export async function removeProfileImage(userId: string): Promise<void> {
  const base = API_ENDPOINTS.user.profileImage;
  const separator = base.includes('?') ? '&' : '?';
  await apiClient.delete(`${base}${separator}userId=${encodeURIComponent(userId)}`);
}