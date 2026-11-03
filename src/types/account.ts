export type ForgotPinRequest = {
    email: string;
};

export type VerifyCodeRequest = {
    email: string;
    code: string;
};

export type UpdatePinRequest = {
    email: string;
    code: string;
    newPin: string;
    confirmPin: string;
};


export interface ResetPasswordPayload {
    oldPin: string;
    newPin: string;
    confirmPin: string;
}

export type ResendVerificationResponse = {
    success: boolean;
    message?: string | null;
    errorMessage?: string | null;
};


export type SendDualEmailOtpPayload = {
  firstEmail: string;
  secondEmail: string;
};

export type VerifyDualEmailOtpPayload = SendDualEmailOtpPayload & {
  firstOtp: string;
  secondOtp: string;
};
