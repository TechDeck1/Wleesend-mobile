import { apiClient } from '@/api/client';
import { request } from '@/api/request';
import { GenericResponse } from '@/api/types';
import { API_ENDPOINTS } from '@/config/api';
import { ForgotPinRequest, ResendVerificationResponse, ResetPasswordPayload, SendDualEmailOtpPayload, UpdatePinRequest, VerifyCodeRequest, VerifyDualEmailOtpPayload } from '@/types/account';

export function sendDualEmailOtp(payload: SendDualEmailOtpPayload): Promise<GenericResponse> {
  return apiClient.post<GenericResponse, SendDualEmailOtpPayload>(
    API_ENDPOINTS.account.sendDualEmailOtp,
    payload,
    { skipAuth: true },
  );
}

export function verifyDualEmailOtp(payload: VerifyDualEmailOtpPayload): Promise<GenericResponse> {
  return apiClient.post<GenericResponse, VerifyDualEmailOtpPayload>(
    API_ENDPOINTS.account.verifyDualEmailOtp,
    payload,
    { skipAuth: true },
  );
}

export async function forgotPinRequest(payload: ForgotPinRequest): Promise<string> {
    const response = await apiClient.post<unknown, ForgotPinRequest>(
        API_ENDPOINTS.account.forgotPin,
        payload,
    );
    return readMessage(
        response,
        'We sent a code to your email.',
        'Could not send the code. Please try again.',
    );
}

export async function verifyCode(payload: VerifyCodeRequest): Promise<string> {
    const response = await apiClient.post<unknown, VerifyCodeRequest>(
        API_ENDPOINTS.account.forgotPin,
        payload,
    );
    return readMessage(
        response,
        'Code verified.',
        'That code is incorrect or has expired.',
    );
}

export async function updatePin(payload: UpdatePinRequest): Promise<string> {
    const response = await apiClient.post<unknown, UpdatePinRequest>(
        API_ENDPOINTS.account.forgotPin,
        payload,
    );
    return readMessage(
        response,
        'Password updated successfully.',
        'Could not update your password. Please try again.',
    );
}

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



export async function resendVerificationEmail(email: string): Promise<string> {
    const response = await request<ResendVerificationResponse, { email: string }>(
        'POST',
        API_ENDPOINTS.auth.resendVerificationEmail,
        {
            body: { email: email.trim() },
            skipAuth: true,
        },
    );

    if (!response?.success) {
        throw new Error(response.errorMessage || response.message || 'Unable to resend the verification email.');
    }

    return response.message || 'Verification email sent.';
}


function readMessage(response: unknown, okFallback: string, errorFallback: string): string {
    if (typeof response === 'string') {
        return response || okFallback;
    }

    if (response && typeof response === 'object') {
        const { success, message } = response as { success?: boolean; message?: unknown };
        const text = typeof message === 'string' ? message : '';

        if (success === false) {
            throw new Error(text || errorFallback);
        }
        if (text) return text;
    }

    return okFallback;
}
