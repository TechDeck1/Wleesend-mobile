import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/config/api';

export type ResetPasswordPayload = {
    oldPin: string;
    newPin: string;
    confirmPin: string;
};


export async function resetPassword(payload: ResetPasswordPayload): Promise<string> {

    const URL = API_ENDPOINTS.account.resetPassword;
    const response = await apiClient.post<unknown, ResetPasswordPayload>(URL, payload);

    if (typeof response === 'string') {
        return response || 'Password reset successfully.';
    }

    if (response && typeof response === 'object') {
        const { success, message } = response as { success?: boolean; message?: unknown };
        const text = typeof message === 'string' ? message : '';

        if (success === false) {
            throw new Error(text || 'Could not reset your password. Please try again.');
        }
        if (text) return text;
    }

    return 'Password reset successfully.';
}