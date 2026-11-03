export type LoginResponse = {
  success: boolean;
  token?: string | null;
  userId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profilePic?: string | null;
  phoneNumber?: string | null;
  accountNumber?: string | null;
  email?: string | null;
  role?: string | null;
  errorMessage?: string | null;
};

export type RegistrationResponse = {
  success: boolean;
  errorMessage?: string | null;
  message?: string | null;
};

export type LoginCredentials = {
  email: string;
  pin: string;
};

export type Registration = {
  firstName: string;
  lastName: string;
  emailId: string;
  pin: string;
  ConfirmPin: string;
  KYCStatusId: number;
  KYCLevel: number;
  phoneNumber: string;
};