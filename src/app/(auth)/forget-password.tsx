import ForgotPasswordScreen from '@/screens/forgetPassword';
import { useRouter } from 'expo-router';

export default function ForgotPasswordRoute() {
  const router = useRouter();

  return (
    <ForgotPasswordScreen
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
    />
  );
}