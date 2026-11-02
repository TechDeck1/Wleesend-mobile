# WleeSend mobile app

One codebase for iOS and Android, built with React Native and Expo (SDK 57).

## Run it

You need [Node.js](https://nodejs.org) (LTS) installed.

```bash
npm install
npx expo start
```

Then either:

- scan the QR code with the **Expo Go** app on an iPhone or Android phone, or
- run `npx expo run:ios` on a Mac with Xcode, or `npx expo run:android` with Android Studio installed, to build and launch the native app.

## The Xcode and Android Studio projects

Both native projects are already generated in this folder:

- **iOS:** on a Mac with Xcode, run `npx expo run:ios`. It installs the iOS dependencies and launches the app in the simulator. After that you can open `ios/WleeSend.xcworkspace` in Xcode.
- **Android:** run `npx expo run:android`, or open the `android/` folder in Android Studio.

The `ios/` and `android/` folders are generated from `app.json`. If you change settings there (name, icon, app ID), regenerate them with `npx expo prebuild --clean` rather than editing them by hand.

## Build for the App Store and Google Play

Expo's cloud build service (EAS) builds and signs both apps without a Mac:

```bash
npx eas-cli@latest build --platform all
npx eas-cli@latest submit --platform all
```

You need an Apple Developer account and a Google Play developer account.

## Where things are

| Path | What it is |
| --- | --- |
| `src/app/(tabs)/` | The four tab screens: Home, Products, Transactions, Profile |
| `src/app/send/` | Send flow: details, payment, confirmation |
| `src/app/account/verify-emails.tsx` | Two-step dual email OTP verification (`/account/verify-emails`) |
| `src/app/about.tsx`, `src/app/support.tsx` | Opened from Profile |
| `src/components/ui.tsx` | Shared buttons, cards, fields, icons |
| `src/config/api.ts` | Backend URL, API route paths and website URL |
| `src/theme.ts` | Brand colors (light and dark) and fonts |
| `src/data.ts` | Operators, packages and the fee rate |
| `src/store.tsx` | In-memory state: the order in progress and transaction history |

Set `EXPO_PUBLIC_API_URL` in your environment to configure the backend base URL. `API_ENDPOINTS` in `src/config/api.ts` builds full endpoint URLs from that base; update the paths there to match the actual WleeSend API before connecting requests. Values prefixed with `EXPO_PUBLIC_` are included in the app bundle, so never put secrets in them.

Use the shared caller in `src/api/client.ts` for API requests:

```ts
import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/config/api';

type LoginResponse = {
  success: boolean;
  token: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
};
type LoginCredentials = { email: string; pin: string };
type Product = { id: string; name: string };

const session = await apiClient.post<LoginResponse, LoginCredentials>(
  API_ENDPOINTS.auth.login,
  { email, pin },
);

const products = await apiClient.get<Product[]>(API_ENDPOINTS.products, {
  params: { page: 1, active: true },
  accessToken: session.token,
});
```

The client supports `get`, `post`, `patch`, `delete`, and a generic `request` method. It serializes request bodies as JSON, parses JSON responses, and throws `ApiError` for non-success HTTP responses. Pass an `AbortSignal` with `signal` to cancel a request; requests also have a 30-second timeout by default (`timeoutMs` can override it).

Login and registration are connected through the auth endpoints in `src/config/api.ts`. A successful registration opens the email verification screen; users sign in after activating their account. The screen can resend verification email through the configured resend endpoint. On iOS and Android, the signed-in token and returned user profile are persisted with `expo-secure-store`; API calls attach the token as a bearer credential. A `401` clears the saved session. The backend should validate that bearer token on each protected request. On web, the session is kept in memory only because SecureStore is a native-device storage API.

Registration sends `firstName`, `lastName`, `emailId`, `pin`, `ConfirmPin`, `phoneNumber`, and the configured defaults `KYCStatusId: 1` and `KYCLevel: 1`. After registration succeeds, the app signs in with the submitted email and PIN.

## Still to connect before launch

- **Backend.** Everything in `src/data.ts` and `src/store.tsx` is placeholder data held in memory. Connect login, the product catalogue, orders and transaction history to the WleeSend API.
- **Payments.** The card fields in `src/app/send/payment.tsx` are visual only and nothing is charged. Replace them with your payment provider's mobile SDK.
- **Account actions.** Change email, Reset password and Log out show a "not connected" alert.
- **App identity.** `app.json` uses the placeholder ID `com.wleesend.app` for both stores, and the app icon is still Expo's default. Set your own before the first store build.
- **Package prices.** Packages in `src/data.ts` with `price: null` show "Price TBC" and can't be chosen until a price is set.
- **Assumptions to confirm.** The LEC form fields and the 12% fee on utility credit were inferred from website screenshots.
