import type { User } from '@/store';

export type SignUpForm = Pick<User, 'firstName' | 'lastName' | 'email' | 'phone'> & {
  password: string;
  confirm: string;
};
export type SignUpErrors = Partial<Record<keyof SignUpForm, string>>;
