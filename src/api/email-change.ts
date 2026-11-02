import { API_ENDPOINTS } from "@/config/api";
import { apiClient, GenericResponse, SendDualEmailOtpPayload, VerifyDualEmailOtpPayload } from "./client";

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