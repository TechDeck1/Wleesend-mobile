export const MIN_PASSWORD_LENGTH = 8;
export const OTP_LENGTH = 6;
export const OTP_CODE_PATTERN = new RegExp(`^\\d{${OTP_LENGTH}}$`);
export const OTP_RESEND_COOLDOWN_SECONDS = 30;
export const OTP_RESEND_COOLDOWN_MS = OTP_RESEND_COOLDOWN_SECONDS * 1000;
export const OTP_LIFETIME_MS = 10 * 60 * 1000;
