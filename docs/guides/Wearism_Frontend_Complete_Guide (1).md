**WEARISM**

Frontend Integration Master Guide

**From UI Mockups → Production-Ready App**

*iOS + Android · App Store Ready · Full API Integration · 6 Phases*

  ----------------------------------- -----------------------------------
  Platform                            **iOS + Android (Expo managed
                                      workflow)**

  Framework                           **React Native + Expo Router +
                                      NativeWind**

  Design System                       **Helvetica Neue · #FF6B35 Orange ·
                                      Pure Black**

  Current State                       **UI Mockups --- zero API wiring**

  New Packages                        **axios · zustand · react-query ·
                                      expo-secure-store + 3 more**

  Phases                              **6 phases --- do them in order**

  App Store                           **Apple + Google Play compliance
                                      notes in each phase**
  ----------------------------------- -----------------------------------

**Section 0 --- Global UI Rules (Apply Throughout ALL Phases)**

These rules come from your existing ui.md and must be applied to every
screen you build or modify. They are listed here so you have them in one
place without switching documents.

+-----------------------------------------------------------------------+
| **🎨 UI / Styling Rules**                                             |
|                                                                       |
| Font: Helvetica Neue ONLY. Always set fontFamily in style prop        |
| explicitly: style={{ fontFamily: \'HelveticaNeue-Bold\' }}. Never     |
| rely on className alone for font.                                     |
|                                                                       |
| Background: Pure black (#000000) + LinearGradient overlay:            |
| colors={\                                                             |
| [\'rgba(60,0,8,0.45)\',\'rgba(60,0,8,0.30)\',\'rgba(60,0,8,0.55)\'\]} |
|                                                                       |
| Primary accent: #FF6B35 --- buttons, active icons, borders, Ionicons  |
| active state.                                                         |
|                                                                       |
| Every screen: wrap in SafeAreaView from                               |
| react-native-safe-area-context. No exceptions.                        |
|                                                                       |
| ScrollView paddingBottom: 100 --- prevents content hiding behind      |
| BottomNav.                                                            |
|                                                                       |
| Buttons: bg-\[#FF6B35\] py-4 rounded-full for primary. bg-white/10    |
| rounded-xl border border-white/20 for secondary.                      |
|                                                                       |
| Form inputs: bg-white/10 rounded-xl px-4 py-4 flex-row items-center   |
| border border-white/20. Ionicons in #FF6B35.                          |
|                                                                       |
| Glassmorphism containers: bg-black/40 backdrop-blur-sm border         |
| border-white/20 rounded-2xl.                                          |
|                                                                       |
| Loading states: show ActivityIndicator in #FF6B35 --- never leave a   |
| blank screen during data fetching.                                    |
|                                                                       |
| Error states: show error message + retry button. Never show raw error |
| objects or stack traces.                                              |
|                                                                       |
| Icons: Ionicons from \@expo/vector-icons exclusively. Active:         |
| #FF6B35. Inactive: rgba(255,255,255,0.6).                             |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **🍎 Apple App Store Requirement**                                    |
|                                                                       |
| Privacy: Any use of camera, photo library, or notifications requires  |
| NSCameraUsageDescription, NSPhotoLibraryUsageDescription,             |
| NSUserNotificationsUsageDescription in app.json → ios.infoPlist.      |
| Apple WILL reject without these.                                      |
|                                                                       |
| GDPR/Privacy Policy: Must link a Privacy Policy URL in the App Store  |
| listing AND inside the app. Required because Wearism collects         |
| personal data (name, email, body measurements, location for           |
| delivery).                                                            |
|                                                                       |
| Data deletion: Apple requires an account deletion option accessible   |
| from within the app. The DELETE /auth/account endpoint covers this    |
| --- the UI button must exist in Settings/Profile.                     |
|                                                                       |
| Crash-free: Never let unhandled promise rejections crash the app.     |
| Always wrap async calls in try/catch. Add a global ErrorBoundary      |
| component.                                                            |
|                                                                       |
| No placeholder content in production build: Remove all hardcoded      |
| arrays (feedCards, weeklyOutfits, wardrobeCategories etc.) before     |
| submitting. Apple reviewers test with real flows.                     |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **PHASE 1**                                                           |
|                                                                       |
| **Foundation + Authentication**                                       |
|                                                                       |
| *API client · Secure token storage · Auth guard · Login · Signup ·    |
| Forgot Password · Push token · Error boundary*                        |
+-----------------------------------------------------------------------+

This phase is the skeleton of the entire app. Nothing else can work
until this is done. The API client, token management, auth guard, and
Zustand stores built here are imported by every other phase.

  ------------- ------------------------------------------------------------------
  **INSTALL**   **Packages for Phase 1**

  ------------- ------------------------------------------------------------------

+-----------------------------------------------------------------------+
| cd mobile-wearism-frontend                                            |
|                                                                       |
| npx expo install axios                                                |
|                                                                       |
| npx expo install zustand                                              |
|                                                                       |
| npx expo install \@tanstack/react-query                               |
|                                                                       |
| npx expo install expo-secure-store                                    |
|                                                                       |
| npx expo install \@react-native-firebase/app                          |
|                                                                       |
| npx expo install \@react-native-firebase/messaging                    |
|                                                                       |
| \# Also add these to app.json for Apple compliance:                   |
|                                                                       |
| \# ios.infoPlist.NSPhotoLibraryUsageDescription                       |
|                                                                       |
| \# ios.infoPlist.NSCameraUsageDescription                             |
|                                                                       |
| \# ios.infoPlist.NSUserNotificationsUsageDescription                  |
+-----------------------------------------------------------------------+

  --------- ------------------------------------------------------------------
  **1.1**   **Environment setup --- .env**

  --------- ------------------------------------------------------------------

+-----------------------------------------------------------------------+
| \# .env (project root)                                                |
|                                                                       |
| EXPO_PUBLIC_API_BASE_URL=http://localhost:3000                        |
|                                                                       |
| \# When deploying:                                                    |
|                                                                       |
| \# EXPO_PUBLIC_API_BASE_URL=https://your-production-api.com           |
+-----------------------------------------------------------------------+

  --------- ------------------------------------------------------------------
  **1.2**   **src/lib/apiClient.ts --- Axios with auth + auto-refresh**

  --------- ------------------------------------------------------------------

This is the most important file in the frontend. It intercepts every 401
response, silently refreshes the token, and replays the original
request. The user never sees a logout unless the refresh token itself
has expired.

+-----------------------------------------------------------------------+
| // src/lib/apiClient.ts                                               |
|                                                                       |
| import axios from \'axios\';                                          |
|                                                                       |
| import \* as SecureStore from \'expo-secure-store\';                  |
|                                                                       |
| const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL!;               |
|                                                                       |
| export const apiClient = axios.create({                               |
|                                                                       |
| baseURL: BASE_URL,                                                    |
|                                                                       |
| timeout: 15000,                                                       |
|                                                                       |
| headers: { \'Content-Type\': \'application/json\' },                  |
|                                                                       |
| });                                                                   |
|                                                                       |
| // Inject token on every request                                      |
|                                                                       |
| apiClient.interceptors.request.use(async (config) =\> {               |
|                                                                       |
| const token = await SecureStore.getItemAsync(\'access_token\');       |
|                                                                       |
| if (token) config.headers.Authorization = \`Bearer \${token}\`;       |
|                                                                       |
| return config;                                                        |
|                                                                       |
| });                                                                   |
|                                                                       |
| // Handle 401 --- refresh and replay                                  |
|                                                                       |
| let isRefreshing = false;                                             |
|                                                                       |
| let queue: Array\<(t: string) =\> void\> = \[\];                      |
|                                                                       |
| apiClient.interceptors.response.use(                                  |
|                                                                       |
| (res) =\> res,                                                        |
|                                                                       |
| async (error) =\> {                                                   |
|                                                                       |
| const original = error.config;                                        |
|                                                                       |
| if (error.response?.status !== 401 \|\| original.\_retry) {           |
|                                                                       |
| return Promise.reject(error);                                         |
|                                                                       |
| }                                                                     |
|                                                                       |
| original.\_retry = true;                                              |
|                                                                       |
| if (isRefreshing) {                                                   |
|                                                                       |
| return new Promise((resolve) =\> {                                    |
|                                                                       |
| queue.push((token) =\> {                                              |
|                                                                       |
| original.headers.Authorization = \`Bearer \${token}\`;                |
|                                                                       |
| resolve(apiClient(original));                                         |
|                                                                       |
| });                                                                   |
|                                                                       |
| });                                                                   |
|                                                                       |
| }                                                                     |
|                                                                       |
| isRefreshing = true;                                                  |
|                                                                       |
| try {                                                                 |
|                                                                       |
| const refresh = await SecureStore.getItemAsync(\'refresh_token\');    |
|                                                                       |
| const { data } = await axios.post(\`\${BASE_URL}/auth/refresh\`, {    |
|                                                                       |
| refresh_token: refresh,                                               |
|                                                                       |
| });                                                                   |
|                                                                       |
| const { access_token, refresh_token } = data.session;                 |
|                                                                       |
| await SecureStore.setItemAsync(\'access_token\', access_token);       |
|                                                                       |
| await SecureStore.setItemAsync(\'refresh_token\', refresh_token);     |
|                                                                       |
| queue.forEach((cb) =\> cb(access_token));                             |
|                                                                       |
| queue = \[\];                                                         |
|                                                                       |
| original.headers.Authorization = \`Bearer \${access_token}\`;         |
|                                                                       |
| return apiClient(original);                                           |
|                                                                       |
| } catch {                                                             |
|                                                                       |
| await SecureStore.deleteItemAsync(\'access_token\');                  |
|                                                                       |
| await SecureStore.deleteItemAsync(\'refresh_token\');                 |
|                                                                       |
| // Trigger auth store to sign out                                     |
|                                                                       |
| const { useAuthStore } = await import(\'../stores/authStore\');       |
|                                                                       |
| useAuthStore.getState().clearAuth();                                  |
|                                                                       |
| return Promise.reject(error);                                         |
|                                                                       |
| } finally {                                                           |
|                                                                       |
| isRefreshing = false;                                                 |
|                                                                       |
| }                                                                     |
|                                                                       |
| }                                                                     |
|                                                                       |
| );                                                                    |
+-----------------------------------------------------------------------+

  --------- ------------------------------------------------------------------
  **1.3**   **src/stores/authStore.ts --- Zustand global auth state**

  --------- ------------------------------------------------------------------

+-----------------------------------------------------------------------+
| // src/stores/authStore.ts                                            |
|                                                                       |
| import { create } from \'zustand\';                                   |
|                                                                       |
| import \* as SecureStore from \'expo-secure-store\';                  |
|                                                                       |
| import { apiClient } from \'../lib/apiClient\';                       |
|                                                                       |
| interface User { id: string; email: string; }                         |
|                                                                       |
| interface AuthStore {                                                 |
|                                                                       |
| user: User \| null;                                                   |
|                                                                       |
| isSignedIn: boolean;                                                  |
|                                                                       |
| isLoading: boolean;                                                   |
|                                                                       |
| login: (email: string, password: string) =\> Promise\<void\>;         |
|                                                                       |
| signup: (email: string, password: string, fullName: string) =\>       |
| Promise\<void\>;                                                      |
|                                                                       |
| logout: () =\> Promise\<void\>;                                       |
|                                                                       |
| clearAuth: () =\> void;                                               |
|                                                                       |
| hydrate: () =\> Promise\<void\>;                                      |
|                                                                       |
| }                                                                     |
|                                                                       |
| export const useAuthStore = create\<AuthStore\>((set) =\> ({          |
|                                                                       |
| user: null, isSignedIn: false, isLoading: true,                       |
|                                                                       |
| hydrate: async () =\> {                                               |
|                                                                       |
| try {                                                                 |
|                                                                       |
| const \[token, userRaw\] = await Promise.all(\[                       |
|                                                                       |
| SecureStore.getItemAsync(\'access_token\'),                           |
|                                                                       |
| SecureStore.getItemAsync(\'user\'),                                   |
|                                                                       |
| \]);                                                                  |
|                                                                       |
| if (token && userRaw) {                                               |
|                                                                       |
| set({ isSignedIn: true, user: JSON.parse(userRaw), isLoading: false   |
| });                                                                   |
|                                                                       |
| } else {                                                              |
|                                                                       |
| set({ isLoading: false });                                            |
|                                                                       |
| }                                                                     |
|                                                                       |
| } catch { set({ isLoading: false }); }                                |
|                                                                       |
| },                                                                    |
|                                                                       |
| login: async (email, password) =\> {                                  |
|                                                                       |
| const { data } = await apiClient.post(\'/auth/login\', { email,       |
| password });                                                          |
|                                                                       |
| await Promise.all(\[                                                  |
|                                                                       |
| SecureStore.setItemAsync(\'access_token\',                            |
| data.session.access_token),                                           |
|                                                                       |
| SecureStore.setItemAsync(\'refresh_token\',                           |
| data.session.refresh_token),                                          |
|                                                                       |
| SecureStore.setItemAsync(\'user\', JSON.stringify(data.user)),        |
|                                                                       |
| \]);                                                                  |
|                                                                       |
| set({ isSignedIn: true, user: data.user });                           |
|                                                                       |
| },                                                                    |
|                                                                       |
| signup: async (email, password, fullName) =\> {                       |
|                                                                       |
| await apiClient.post(\'/auth/signup\', {                              |
|                                                                       |
| email, password, full_name: fullName, gdpr_consent: true,             |
|                                                                       |
| });                                                                   |
|                                                                       |
| },                                                                    |
|                                                                       |
| logout: async () =\> {                                                |
|                                                                       |
| try { await apiClient.post(\'/auth/logout\'); } catch {}              |
|                                                                       |
| await Promise.all(\[                                                  |
|                                                                       |
| SecureStore.deleteItemAsync(\'access_token\'),                        |
|                                                                       |
| SecureStore.deleteItemAsync(\'refresh_token\'),                       |
|                                                                       |
| SecureStore.deleteItemAsync(\'user\'),                                |
|                                                                       |
| \]);                                                                  |
|                                                                       |
| set({ isSignedIn: false, user: null });                               |
|                                                                       |
| },                                                                    |
|                                                                       |
| clearAuth: () =\> set({ isSignedIn: false, user: null }),             |
|                                                                       |
| }));                                                                  |
+-----------------------------------------------------------------------+

  --------- ------------------------------------------------------------------
  **1.4**   **src/stores/cartStore.ts + profileStore.ts**

  --------- ------------------------------------------------------------------

+-----------------------------------------------------------------------+
| // src/stores/cartStore.ts --- cart badge count for tab bar           |
|                                                                       |
| import { create } from \'zustand\';                                   |
|                                                                       |
| export const useCartStore = create\<{ count: number;                  |
| setCount:(n:number)=\>void }\>(                                       |
|                                                                       |
| (set) =\> ({ count: 0, setCount: (n) =\> set({ count: n }) })         |
|                                                                       |
| );                                                                    |
|                                                                       |
| // src/stores/profileStore.ts --- cached profile data                 |
|                                                                       |
| import { create } from \'zustand\';                                   |
|                                                                       |
| export const useProfileStore = create\<{ profile: any;                |
| setProfile:(p:any)=\>void; clear:()=\>void }\>(                       |
|                                                                       |
| (set) =\> ({                                                          |
|                                                                       |
| profile: null,                                                        |
|                                                                       |
| setProfile: (p) =\> set({ profile: p }),                              |
|                                                                       |
| clear: () =\> set({ profile: null }),                                 |
|                                                                       |
| })                                                                    |
|                                                                       |
| );                                                                    |
+-----------------------------------------------------------------------+

  --------- ------------------------------------------------------------------
  **1.5**   **app/\_layout.tsx --- QueryClient + AuthGuard + Error Boundary**

  --------- ------------------------------------------------------------------

+-----------------------------------------------------------------------+
| // app/\_layout.tsx                                                   |
|                                                                       |
| import { useEffect } from \'react\';                                  |
|                                                                       |
| import { Slot, useRouter, useSegments } from \'expo-router\';         |
|                                                                       |
| import { QueryClient, QueryClientProvider } from                      |
| \'@tanstack/react-query\';                                            |
|                                                                       |
| import { useAuthStore } from \'../src/stores/authStore\';             |
|                                                                       |
| const queryClient = new QueryClient({                                 |
|                                                                       |
| defaultOptions: {                                                     |
|                                                                       |
| queries: { staleTime: 5 \* 60 \* 1000, retry: 2 },                    |
|                                                                       |
| },                                                                    |
|                                                                       |
| });                                                                   |
|                                                                       |
| function AuthGuard() {                                                |
|                                                                       |
| const { isSignedIn, isLoading, hydrate } = useAuthStore();            |
|                                                                       |
| const segments = useSegments();                                       |
|                                                                       |
| const router = useRouter();                                           |
|                                                                       |
| useEffect(() =\> { hydrate(); }, \[\]);                               |
|                                                                       |
| useEffect(() =\> {                                                    |
|                                                                       |
| if (isLoading) return;                                                |
|                                                                       |
| const inAuth = segments\[0\] === \'(auth)\';                          |
|                                                                       |
| if (!isSignedIn && !inAuth) router.replace(\'/(auth)/login\');        |
|                                                                       |
| else if (isSignedIn && inAuth) router.replace(\'/(tabs)/home\');      |
|                                                                       |
| }, \[isSignedIn, isLoading, segments\]);                              |
|                                                                       |
| return \<Slot /\>;                                                    |
|                                                                       |
| }                                                                     |
|                                                                       |
| export default function RootLayout() {                                |
|                                                                       |
| // \... existing font loading \...                                    |
|                                                                       |
| return (                                                              |
|                                                                       |
| \<QueryClientProvider client={queryClient}\>                          |
|                                                                       |
| \<AuthGuard /\>                                                       |
|                                                                       |
| \</QueryClientProvider\>                                              |
|                                                                       |
| );                                                                    |
|                                                                       |
| }                                                                     |
+-----------------------------------------------------------------------+

  --------- ------------------------------------------------------------------
  **1.6**   **src/lib/notifications.ts --- FCM token registration**

  --------- ------------------------------------------------------------------

+-----------------------------------------------------------------------+
| // src/lib/notifications.ts                                           |
|                                                                       |
| import messaging from \'@react-native-firebase/messaging\';           |
|                                                                       |
| import { apiClient } from \'./apiClient\';                            |
|                                                                       |
| export async function registerFcmToken() {                            |
|                                                                       |
| try {                                                                 |
|                                                                       |
| const status = await messaging().requestPermission();                 |
|                                                                       |
| const ok = status === messaging.AuthorizationStatus.AUTHORIZED        |
|                                                                       |
| \|\| status === messaging.AuthorizationStatus.PROVISIONAL;            |
|                                                                       |
| if (!ok) return;                                                      |
|                                                                       |
| const token = await messaging().getToken();                           |
|                                                                       |
| if (!token) return;                                                   |
|                                                                       |
| await apiClient.post(\'/notifications/token\', { token });            |
|                                                                       |
| } catch (err) {                                                       |
|                                                                       |
| console.warn(\'\[FCM\]\', err);                                       |
|                                                                       |
| }                                                                     |
|                                                                       |
| }                                                                     |
|                                                                       |
| export function setupNotificationHandlers(router: any) {              |
|                                                                       |
| messaging().onMessage(async () =\> {                                  |
|                                                                       |
| // Show in-app toast/banner for foreground notifications              |
|                                                                       |
| });                                                                   |
|                                                                       |
| messaging().onNotificationOpenedApp((msg) =\> {                       |
|                                                                       |
| const { type, postId, orderId } = msg.data \|\| {};                   |
|                                                                       |
| if (type === \'follow\' \|\| type === \'like\' \|\| type ===          |
| \'comment\') router.push(\`/social/post/\${postId}\`);                |
|                                                                       |
| if (type === \'order\') router.push(\'/orders\');                     |
|                                                                       |
| });                                                                   |
|                                                                       |
| }                                                                     |
+-----------------------------------------------------------------------+

  --------- ------------------------------------------------------------------
  **1.7**   **Wire up login.tsx --- replace dummy logic**

  --------- ------------------------------------------------------------------

+-----------------------------------------------------------------------+
| // app/(auth)/login.tsx --- REMOVE dummy success routing, REPLACE     |
| with:                                                                 |
|                                                                       |
| import { useState } from \'react\';                                   |
|                                                                       |
| import { useAuthStore } from \'../../src/stores/authStore\';          |
|                                                                       |
| import { useRouter } from \'expo-router\';                            |
|                                                                       |
| const { login } = useAuthStore();                                     |
|                                                                       |
| const router = useRouter();                                           |
|                                                                       |
| const \[loading, setLoading\] = useState(false);                      |
|                                                                       |
| const \[error, setError\] = useState(\'\');                           |
|                                                                       |
| const handleLogin = async () =\> {                                    |
|                                                                       |
| if (!email \|\| !password) { setError(\'Please fill in all            |
| fields.\'); return; }                                                 |
|                                                                       |
| setLoading(true); setError(\'\');                                     |
|                                                                       |
| try {                                                                 |
|                                                                       |
| await login(email, password);                                         |
|                                                                       |
| // AuthGuard handles redirect automatically                           |
|                                                                       |
| } catch (err: any) {                                                  |
|                                                                       |
| setError(err.response?.data?.error \|\| \'Login failed. Check your    |
| credentials.\');                                                      |
|                                                                       |
| } finally { setLoading(false); }                                      |
|                                                                       |
| };                                                                    |
|                                                                       |
| // In JSX --- replace hardcoded success button with:                  |
|                                                                       |
| // \<TouchableOpacity onPress={handleLogin} disabled={loading}\>      |
|                                                                       |
| // {loading                                                           |
|                                                                       |
| // ? \<ActivityIndicator color=\'#FFFFFF\' /\>                        |
|                                                                       |
| // : \<Text style={{ fontFamily: \'HelveticaNeue-Heavy\' }}\>SIGN     |
| IN\</Text\>}                                                          |
|                                                                       |
| // \</TouchableOpacity\>                                              |
|                                                                       |
| // {error ? \<Text className=\'text-orange-400 text-center            |
| mt-2\'\>{error}\</Text\> : null}                                      |
+-----------------------------------------------------------------------+

  --------- ------------------------------------------------------------------
  **1.8**   **Wire up signup.tsx**

  --------- ------------------------------------------------------------------

+-----------------------------------------------------------------------+
| // app/(auth)/signup.tsx                                              |
|                                                                       |
| const { signup } = useAuthStore();                                    |
|                                                                       |
| const \[done, setDone\] = useState(false);                            |
|                                                                       |
| const handleSignup = async () =\> {                                   |
|                                                                       |
| if (!gdprConsent) { setError(\'You must accept the privacy            |
| policy.\'); return; }                                                 |
|                                                                       |
| setLoading(true); setError(\'\');                                     |
|                                                                       |
| try {                                                                 |
|                                                                       |
| await signup(email, password, fullName);                              |
|                                                                       |
| setDone(true);                                                        |
|                                                                       |
| } catch (err: any) {                                                  |
|                                                                       |
| setError(err.response?.data?.error \|\| \'Signup failed.\');          |
|                                                                       |
| } finally { setLoading(false); }                                      |
|                                                                       |
| };                                                                    |
|                                                                       |
| // If done: show success card:                                        |
|                                                                       |
| // \<View className=\'bg-white/10 rounded-2xl p-6 border              |
| border-white/20\'\>                                                   |
|                                                                       |
| // \<Text style={{ fontFamily: \'HelveticaNeue-Bold\' }}              |
| className=\'text-white text-xl\'\>                                    |
|                                                                       |
| // Check your email                                                   |
|                                                                       |
| // \</Text\>                                                          |
|                                                                       |
| // \<Text className=\'text-white/60 mt-2\'\>                          |
|                                                                       |
| // We sent a verification link to {email}. Click it to activate your  |
| account.                                                              |
|                                                                       |
| // \</Text\>                                                          |
|                                                                       |
| // \</View\>                                                          |
+-----------------------------------------------------------------------+

  --------- ------------------------------------------------------------------
  **1.9**   **Create app/(auth)/forgot-password.tsx**

  --------- ------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **📱 forgot-password.tsx --- new screen**                             |
|                                                                       |
| Layout: Same dark background + glassmorphism card as login. \'Forgot  |
| Password\' header. Email input field (Ionicons mail icon). \'SEND     |
| RESET LINK\' primary button. Back to login link at bottom.            |
|                                                                       |
| After submit (success or fail): always show \'If that email exists, a |
| reset link has been sent.\' --- never reveal whether email exists     |
| (security requirement).                                               |
|                                                                       |
| API: POST /auth/forgot-password { email: string }                     |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **✅ Phase 1 Complete When:**                                         |
|                                                                       |
| ☑ Login with real account works and redirects to home                 |
|                                                                       |
| ☑ Signup shows email verification message                             |
|                                                                       |
| ☑ Unauthenticated users hitting any protected route get redirected to |
| /login                                                                |
|                                                                       |
| ☑ Token refresh works silently (test by manually expiring access      |
| token)                                                                |
|                                                                       |
| ☑ FCM token registered on login (check backend logs)                  |
|                                                                       |
| ☑ forgot-password screen built and wired                              |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **PHASE 2**                                                           |
|                                                                       |
| **Profile**                                                           |
|                                                                       |
| *View profile · Edit profile · Avatar upload · Completion score ·     |
| Settings · Delete account*                                            |
+-----------------------------------------------------------------------+

  --------- ------------------------------------------------------------------
  **2.1**   **Wire up profile.tsx --- replace all hardcoded data**

  --------- ------------------------------------------------------------------

+-----------------------------------------------------------------------+
| // app/(tabs)/profile.tsx                                             |
|                                                                       |
| import { useQuery, useQueryClient } from \'@tanstack/react-query\';   |
|                                                                       |
| import { apiClient } from \'../../src/lib/apiClient\';                |
|                                                                       |
| import { useAuthStore } from \'../../src/stores/authStore\';          |
|                                                                       |
| const { data, isLoading } = useQuery({                                |
|                                                                       |
| queryKey: \[\'my-profile\'\],                                         |
|                                                                       |
| queryFn: () =\> apiClient.get(\'/user/profile\').then(r =\> r.data),  |
|                                                                       |
| });                                                                   |
|                                                                       |
| const profile = data?.profile;                                        |
|                                                                       |
| const completionScore = data?.completion_score ?? 0;                  |
|                                                                       |
| // REPLACE these hardcoded values:                                    |
|                                                                       |
| // Followers: 12.3k → profile?.followers_count ?? 0                   |
|                                                                       |
| // Following: 891 → profile?.following_count ?? 0                     |
|                                                                       |
| // Posts: 0 → profile?.posts_count ?? 0                               |
|                                                                       |
| // Name: → profile?.full_name ?? \'Your Name\'                        |
|                                                                       |
| // Avatar: → profile?.avatar_url (Image source)                       |
|                                                                       |
| // Completion bar (add below avatar):                                 |
|                                                                       |
| // \<View className=\'w-full bg-white/10 rounded-full h-1 mt-3\'\>    |
|                                                                       |
| // \<View                                                             |
|                                                                       |
| // className=\'bg-\[#FF6B35\] h-1 rounded-full\'                      |
|                                                                       |
| // style={{ width: \`\${completionScore}%\` }}                        |
|                                                                       |
| // /\>                                                                |
|                                                                       |
| // \</View\>                                                          |
|                                                                       |
| // \<Text className=\'text-white/40 text-xs                           |
| mt-1\'\>{completionScore}% complete\</Text\>                          |
+-----------------------------------------------------------------------+

  --------- ------------------------------------------------------------------
  **2.2**   **Create app/profile/edit.tsx**

  --------- ------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **📱 edit.tsx --- new screen**                                        |
|                                                                       |
| Layout: SafeAreaView + ScrollView. Header bar with back arrow         |
| (Ionicons arrow-back) + \'Save\' button (text, #FF6B35).              |
|                                                                       |
| Fields: Full Name (text input), Gender (bottom sheet picker:          |
| male/female/non_binary/prefer_not_to_say), Age Range (picker:         |
| 13-17/18-24/25-34/35-44/45-54/55+), Height cm (number input), Weight  |
| kg (number input), Body Type (visual picker with icons), Skin Tone    |
| (colour swatch row).                                                  |
|                                                                       |
| Pre-fill all fields from the \[\'my-profile\'\] React Query cache on  |
| mount.                                                                |
|                                                                       |
| API: PATCH /user/profile --- only send fields that changed. On        |
| success: queryClient.invalidateQueries(\[\'my-profile\'\]),           |
| router.back()                                                         |
+-----------------------------------------------------------------------+

  --------- ------------------------------------------------------------------
  **2.3**   **Avatar upload**

  --------- ------------------------------------------------------------------

+-----------------------------------------------------------------------+
| // Inside profile.tsx or edit.tsx --- tap avatar to upload            |
|                                                                       |
| import \* as ImagePicker from \'expo-image-picker\';                  |
|                                                                       |
| import { useQueryClient } from \'@tanstack/react-query\';             |
|                                                                       |
| const queryClient = useQueryClient();                                 |
|                                                                       |
| const pickAndUploadAvatar = async () =\> {                            |
|                                                                       |
| const result = await ImagePicker.launchImageLibraryAsync({            |
|                                                                       |
| mediaTypes: ImagePicker.MediaTypeOptions.Images,                      |
|                                                                       |
| allowsEditing: true,                                                  |
|                                                                       |
| aspect: \[1, 1\],                                                     |
|                                                                       |
| quality: 0.8,                                                         |
|                                                                       |
| });                                                                   |
|                                                                       |
| if (result.canceled) return;                                          |
|                                                                       |
| const asset = result.assets\[0\];                                     |
|                                                                       |
| const form = new FormData();                                          |
|                                                                       |
| form.append(\'file\', {                                               |
|                                                                       |
| uri: asset.uri,                                                       |
|                                                                       |
| name: asset.uri.split(\'/\').pop() \|\| \'avatar.jpg\',               |
|                                                                       |
| type: \'image/jpeg\',                                                 |
|                                                                       |
| } as any);                                                            |
|                                                                       |
| await apiClient.post(\'/user/profile/avatar\', form, {                |
|                                                                       |
| headers: { \'Content-Type\': \'multipart/form-data\' },               |
|                                                                       |
| });                                                                   |
|                                                                       |
| queryClient.invalidateQueries({ queryKey: \[\'my-profile\'\] });      |
|                                                                       |
| };                                                                    |
|                                                                       |
| // Wrap avatar in TouchableOpacity:                                   |
|                                                                       |
| // \<TouchableOpacity onPress={pickAndUploadAvatar}\>                 |
|                                                                       |
| // \<Image source={{ uri: profile?.avatar_url }} \... /\>             |
|                                                                       |
| // \<View \...\> \<Ionicons name=\'camera\' color=\'#FF6B35\'         |
| size={16} /\> \</View\>                                               |
|                                                                       |
| // \</TouchableOpacity\>                                              |
+-----------------------------------------------------------------------+

  --------- ------------------------------------------------------------------
  **2.4**   **Add Settings screen with Delete Account + Privacy Policy**

  --------- ------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **📱 settings.tsx --- new screen (required by Apple)**                |
|                                                                       |
| Layout: List of settings rows. Each row: Ionicons + label + chevron   |
| (Ionicons chevron-forward, white/40).                                 |
|                                                                       |
| Rows: Edit Profile → /profile/edit \| Privacy Policy → open URL in    |
| WebBrowser \| GDPR Data Export → GET /auth/me/data then share JSON \| |
| Delete Account → confirmation alert then DELETE /auth/account \|      |
| Logout → useAuthStore.logout()                                        |
|                                                                       |
| Delete Account: show Alert.alert(\'Delete Account\', \'This cannot be |
| undone. All your data will be permanently deleted.\', \[Cancel,       |
| Delete\]) before calling the API.                                     |
|                                                                       |
| APPLE REQUIREMENT: The \'Delete Account\' option must be findable     |
| within the app. Place a link to Settings in profile.tsx header (gear  |
| icon).                                                                |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **✅ Phase 2 Complete When:**                                         |
|                                                                       |
| ☑ profile.tsx shows real name, avatar, follower/following/post counts |
|                                                                       |
| ☑ Completion score bar visible                                        |
|                                                                       |
| ☑ edit-profile.tsx saves changes via PATCH /user/profile              |
|                                                                       |
| ☑ Avatar upload replaces photo and refreshes without re-login         |
|                                                                       |
| ☑ Settings screen accessible from profile with Delete Account +       |
| Logout + Privacy Policy                                               |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **PHASE 3**                                                           |
|                                                                       |
| **Wardrobe + Outfits + Recommendations**                              |
|                                                                       |
| *Item upload · AI polling · Item detail · Outfit creation · Outfit    |
| detail · Recommendations list/generate/save*                          |
+-----------------------------------------------------------------------+

  --------- ------------------------------------------------------------------
  **3.1**   **Wire up wardrobe.tsx list**

  --------- ------------------------------------------------------------------

+-----------------------------------------------------------------------+
| // app/(tabs)/wardrobe.tsx                                            |
|                                                                       |
| import { useQuery } from \'@tanstack/react-query\';                   |
|                                                                       |
| import { apiClient } from \'../../src/lib/apiClient\';                |
|                                                                       |
| const { data, isLoading, refetch } = useQuery({                       |
|                                                                       |
| queryKey: \[\'wardrobe-items\'\],                                     |
|                                                                       |
| queryFn: () =\> apiClient.get(\'/wardrobe/items?limit=100\').then(r   |
| =\> r.data),                                                          |
|                                                                       |
| });                                                                   |
|                                                                       |
| // Group by wardrobe_slot (replaces wardrobeCategories array):        |
|                                                                       |
| const items = data?.items ?? \[\];                                    |
|                                                                       |
| const slots = {                                                       |
|                                                                       |
| upperwear: items.filter((i:any) =\> i.wardrobe_slot ===               |
| \'upperwear\'),                                                       |
|                                                                       |
| lowerwear: items.filter((i:any) =\> i.wardrobe_slot ===               |
| \'lowerwear\'),                                                       |
|                                                                       |
| outerwear: items.filter((i:any) =\> i.wardrobe_slot ===               |
| \'outerwear\'),                                                       |
|                                                                       |
| accessories: items.filter((i:any) =\> i.wardrobe_slot ===             |
| \'accessories\'),                                                     |
|                                                                       |
| };                                                                    |
|                                                                       |
| // Items without wardrobe_slot = still being classified               |
|                                                                       |
| // Show a \'Classifying\...\' shimmer card for those                  |
|                                                                       |
| const pending = items.filter((i:any) =\> !i.wardrobe_slot);           |
|                                                                       |
| // Pull-to-refresh:                                                   |
|                                                                       |
| // \<ScrollView refreshControl={\<RefreshControl                      |
| refreshing={isLoading} onRefresh={refetch} /\>}\>                     |
+-----------------------------------------------------------------------+

  --------- ------------------------------------------------------------------
  **3.2**   **Create app/wardrobe/item-upload.tsx --- new screen**

  --------- ------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **📱 item-upload.tsx**                                                |
|                                                                       |
| Layout: Full-screen camera/picker area (top 60%), form fields below   |
| (Name, Brand, Condition picker). \'Add to Wardrobe\' primary button.  |
|                                                                       |
| Image: tap to open expo-image-picker (camera or library). Show        |
| selected image in preview. The image_path follows pattern:            |
| {userId}/{uuid}.jpg. Generate UUID client-side with:                  |
| crypto.randomUUID() or uuid package.                                  |
|                                                                       |
| Upload flow: 1) Upload image to Supabase Storage (wardrobe bucket)    |
| using signed URL if available, OR send image_path in the POST body    |
| for backend to handle. 2) POST /wardrobe/items with item_id +         |
| image_path + metadata. 3) Navigate to item-detail.tsx with the new    |
| item_id. AI polling happens there.                                    |
|                                                                       |
| API: POST /wardrobe/items { item_id, image_path, name?, brand?,       |
| condition? } → 201 + { item, ai_status: \'pending\' }                 |
+-----------------------------------------------------------------------+

  --------- ------------------------------------------------------------------
  **3.3**   **Create app/wardrobe/item-detail.tsx --- with AI polling**

  --------- ------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **📱 item-detail.tsx**                                                |
|                                                                       |
| Layout: Large item image (top). Below: item name, brand, condition    |
| badge. AI Results card: wardrobe_slot, fashionclip_main_category,     |
| fashionclip_attributes chips, color swatches from color_dominant_rgb. |
| Action buttons: Edit (navigate to item-edit.tsx), Mark Worn, Delete   |
| (with confirmation).                                                  |
|                                                                       |
| AI polling: if item.wardrobe_slot is null, show animated \'AI is      |
| analysing your item\...\' card with ActivityIndicator in #FF6B35.     |
| Poll GET /wardrobe/items/:id/ai-status every 3 seconds until status = |
| completed or failed.                                                  |
|                                                                       |
| APIs: GET /wardrobe/items/:id · GET /wardrobe/items/:id/ai-status     |
| (polled) · POST /wardrobe/items/:id/worn · DELETE /wardrobe/items/:id |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| // AI polling pattern --- inside item-detail.tsx                      |
|                                                                       |
| const \[itemId\] = useState(route.params.id);                         |
|                                                                       |
| const { data: aiData } = useQuery({                                   |
|                                                                       |
| queryKey: \[\'ai-status\', itemId\],                                  |
|                                                                       |
| queryFn: () =\>                                                       |
| apiClient.get(\`/wardrobe/items/\${itemId}/ai-status\`).then(r =\>    |
| r.data),                                                              |
|                                                                       |
| refetchInterval: (query) =\> {                                        |
|                                                                       |
| const s = query.state.data?.ai?.status;                               |
|                                                                       |
| return s === \'completed\' \|\| s === \'failed\' ? false : 3000;      |
|                                                                       |
| },                                                                    |
|                                                                       |
| enabled: !!itemId,                                                    |
|                                                                       |
| });                                                                   |
|                                                                       |
| const aiDone = aiData?.ai?.status === \'completed\';                  |
+-----------------------------------------------------------------------+

  --------- ------------------------------------------------------------------
  **3.4**   **Create app/wardrobe/outfit-create.tsx**

  --------- ------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **📱 outfit-create.tsx**                                              |
|                                                                       |
| Layout: Header with back + \'Create\' button. Section: \'Select       |
| Items\' --- grid of wardrobe item thumbnails (2-column). Tap to       |
| toggle selected state (orange border + checkmark overlay). Min 1 item |
| required.                                                             |
|                                                                       |
| Below grid: Outfit Name input (optional), Occasion picker (bottom     |
| sheet), Season picker.                                                |
|                                                                       |
| API: POST /wardrobe/outfits { name?, occasion?, item_ids: string\[\], |
| status: \'saved\' }. On success: invalidate \[\'outfits\'\], navigate |
| to outfit-detail.tsx with new outfit id.                              |
+-----------------------------------------------------------------------+

  --------- ------------------------------------------------------------------
  **3.5**   **Wire up Recommendations --- replace weeklyOutfits**

  --------- ------------------------------------------------------------------

+-----------------------------------------------------------------------+
| // In wardrobe.tsx --- \'Weekly AI Fits\' section                     |
|                                                                       |
| import { useQuery, useMutation, useQueryClient } from                 |
| \'@tanstack/react-query\';                                            |
|                                                                       |
| const qc = useQueryClient();                                          |
|                                                                       |
| const { data: recsData, isLoading: recsLoading } = useQuery({         |
|                                                                       |
| queryKey: \[\'recommendations\'\],                                    |
|                                                                       |
| queryFn: () =\>                                                       |
| apiClient.get(\'/recommendations?status=scored&limit=10\').then(r =\> |
| r.data),                                                              |
|                                                                       |
| });                                                                   |
|                                                                       |
| const recs = recsData?.recommendations ?? \[\];                       |
|                                                                       |
| const generateMutation = useMutation({                                |
|                                                                       |
| mutationFn: () =\> apiClient.post(\'/recommendations/generate\'),     |
|                                                                       |
| onSuccess: () =\> qc.invalidateQueries({ queryKey:                    |
| \[\'recommendations\'\] }),                                           |
|                                                                       |
| });                                                                   |
|                                                                       |
| const saveMutation = useMutation({                                    |
|                                                                       |
| mutationFn: (id: string) =\>                                          |
| apiClient.post(\`/recommendations/\${id}/save\`),                     |
|                                                                       |
| onSuccess: () =\> {                                                   |
|                                                                       |
| qc.invalidateQueries({ queryKey: \[\'recommendations\'\] });          |
|                                                                       |
| qc.invalidateQueries({ queryKey: \[\'outfits\'\] });                  |
|                                                                       |
| },                                                                    |
|                                                                       |
| });                                                                   |
|                                                                       |
| const dismissMutation = useMutation({                                 |
|                                                                       |
| mutationFn: (id: string) =\>                                          |
| apiClient.post(\`/recommendations/\${id}/dismiss\`),                  |
|                                                                       |
| onSuccess: () =\> qc.invalidateQueries({ queryKey:                    |
| \[\'recommendations\'\] }),                                           |
|                                                                       |
| });                                                                   |
|                                                                       |
| // Generate button shows: generateMutation.isPending ? spinner :      |
| \'Generate Fits\'                                                     |
|                                                                       |
| // Each rec card has: Save (bookmark icon) + Dismiss (x icon)         |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **✅ Phase 3 Complete When:**                                         |
|                                                                       |
| ☑ wardrobe.tsx shows real items grouped by slot --- no more hardcoded |
| arrays                                                                |
|                                                                       |
| ☑ Item upload creates item + triggers AI classification               |
|                                                                       |
| ☑ item-detail.tsx polls AI status and shows classified attributes     |
| when done                                                             |
|                                                                       |
| ☑ Outfits can be created by selecting items                           |
|                                                                       |
| ☑ Recommendations section shows real data + generate/save/dismiss     |
| works                                                                 |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **PHASE 4**                                                           |
|                                                                       |
| **Social --- Feed, Posts, Comments, Follows**                         |
|                                                                       |
| *Home feed · Trending · Create post · Post detail · Comments · Like · |
| Follow · Followers/Following lists*                                   |
+-----------------------------------------------------------------------+

  --------- ------------------------------------------------------------------
  **4.1**   **Wire up home.tsx --- infinite scroll feed + trending toggle**

  --------- ------------------------------------------------------------------

+-----------------------------------------------------------------------+
| // app/(tabs)/home.tsx --- replace feedCards array                    |
|                                                                       |
| import { useInfiniteQuery } from \'@tanstack/react-query\';           |
|                                                                       |
| import { FlatList, ActivityIndicator } from \'react-native\';         |
|                                                                       |
| const \[feedType, setFeedType\] =                                     |
| useState\<\'home\'\|\'trending\'\>(\'home\');                         |
|                                                                       |
| const { data, fetchNextPage, hasNextPage, isLoading,                  |
| isFetchingNextPage } =                                                |
|                                                                       |
| useInfiniteQuery({                                                    |
|                                                                       |
| queryKey: \[\'feed\', feedType\],                                     |
|                                                                       |
| queryFn: ({ pageParam = 1 }) =\>                                      |
|                                                                       |
| apiClient.get(\`/feed/\${feedType}?page=\${pageParam}&limit=20\`)     |
|                                                                       |
| .then(r =\> r.data),                                                  |
|                                                                       |
| getNextPageParam: (last) =\>                                          |
|                                                                       |
| last.pagination?.has_next ? last.pagination.page + 1 : undefined,     |
|                                                                       |
| initialPageParam: 1,                                                  |
|                                                                       |
| });                                                                   |
|                                                                       |
| const posts = data?.pages.flatMap(p =\> p.posts) ?? \[\];             |
|                                                                       |
| // Toggle UI --- two pill buttons: \'For You\' and \'Trending\'       |
|                                                                       |
| // Tap switches feedType state which changes the query key            |
|                                                                       |
| // FlatList:                                                          |
|                                                                       |
| // data={posts}                                                       |
|                                                                       |
| // keyExtractor={(item) =\> item.id}                                  |
|                                                                       |
| // onEndReached={() =\> { if (hasNextPage) fetchNextPage(); }}        |
|                                                                       |
| // onEndReachedThreshold={0.5}                                        |
|                                                                       |
| // ListFooterComponent={isFetchingNextPage ? \<ActivityIndicator      |
| color=\'#FF6B35\' /\> : null}                                         |
+-----------------------------------------------------------------------+

  --------- ------------------------------------------------------------------
  **4.2**   **Like button --- optimistic update pattern**

  --------- ------------------------------------------------------------------

+-----------------------------------------------------------------------+
| // src/components/LikeButton.tsx --- reusable across all post cards   |
|                                                                       |
| import { useMutation, useQueryClient } from                           |
| \'@tanstack/react-query\';                                            |
|                                                                       |
| import { Ionicons } from \'@expo/vector-icons\';                      |
|                                                                       |
| import { TouchableOpacity, Text } from \'react-native\';              |
|                                                                       |
| import { apiClient } from \'../lib/apiClient\';                       |
|                                                                       |
| export function LikeButton({ post, feedType }: { post: any; feedType: |
| string }) {                                                           |
|                                                                       |
| const qc = useQueryClient();                                          |
|                                                                       |
| const mutation = useMutation({                                        |
|                                                                       |
| mutationFn: () =\> apiClient.post(\`/posts/\${post.id}/like\`),       |
|                                                                       |
| onMutate: async () =\> {                                              |
|                                                                       |
| await qc.cancelQueries({ queryKey: \[\'feed\', feedType\] });         |
|                                                                       |
| const prev = qc.getQueryData(\[\'feed\', feedType\]);                 |
|                                                                       |
| qc.setQueryData(\[\'feed\', feedType\], (old: any) =\> ({             |
|                                                                       |
| \...old,                                                              |
|                                                                       |
| pages: old.pages.map((page: any) =\> ({                               |
|                                                                       |
| \...page,                                                             |
|                                                                       |
| posts: page.posts.map((p: any) =\>                                    |
|                                                                       |
| p.id !== post.id ? p : {                                              |
|                                                                       |
| \...p,                                                                |
|                                                                       |
| viewer_has_liked: !p.viewer_has_liked,                                |
|                                                                       |
| likes_count: p.viewer_has_liked ? p.likes_count - 1 : p.likes_count + |
| 1,                                                                    |
|                                                                       |
| }                                                                     |
|                                                                       |
| ),                                                                    |
|                                                                       |
| })),                                                                  |
|                                                                       |
| }));                                                                  |
|                                                                       |
| return { prev };                                                      |
|                                                                       |
| },                                                                    |
|                                                                       |
| onError: (\_e, \_v, ctx) =\> qc.setQueryData(\[\'feed\', feedType\],  |
| ctx?.prev),                                                           |
|                                                                       |
| });                                                                   |
|                                                                       |
| return (                                                              |
|                                                                       |
| \<TouchableOpacity onPress={() =\> mutation.mutate()}                 |
| activeOpacity={0.7}\>                                                 |
|                                                                       |
| \<Ionicons                                                            |
|                                                                       |
| name={post.viewer_has_liked ? \'heart\' : \'heart-outline\'}          |
|                                                                       |
| size={24}                                                             |
|                                                                       |
| color={post.viewer_has_liked ? \'#FF6B35\' :                          |
| \'rgba(255,255,255,0.7)\'}                                            |
|                                                                       |
| /\>                                                                   |
|                                                                       |
| \<Text className=\'text-white/60 text-xs                              |
| ml-1\'\>{post.likes_count}\</Text\>                                   |
|                                                                       |
| \</TouchableOpacity\>                                                 |
|                                                                       |
| );                                                                    |
|                                                                       |
| }                                                                     |
+-----------------------------------------------------------------------+

  --------- ------------------------------------------------------------------
  **4.3**   **Create app/social/create-post.tsx**

  --------- ------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **📱 create-post.tsx**                                                |
|                                                                       |
| Layout: Header with X (close) and \'POST\' button (orange). Top:      |
| large image picker area (tap to open library or camera --- show       |
| selected image). Below: Caption textarea (500 char max, show          |
| counter). Row of option pills: Outfit tag, Season, Visibility.        |
|                                                                       |
| Outfit tag: opens bottom sheet showing user\'s outfits grid. Select   |
| one to attach.                                                        |
|                                                                       |
| Visibility toggle: 3-option pill row --- Public / Followers Only /    |
| Private. Default: Public.                                             |
|                                                                       |
| API: POST /posts { caption?, image_path?, outfit_id?, season?,        |
| visibility?, tags? }. On success: invalidate \[\'feed\',\'home\'\],   |
| invalidate \[\'posts\', userId\], router.back()                       |
+-----------------------------------------------------------------------+

  --------- ------------------------------------------------------------------
  **4.4**   **Create app/social/post-detail.tsx + comments**

  --------- ------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **📱 post-detail.tsx**                                                |
|                                                                       |
| Layout: ScrollView. Top: full-width post image. Below image: author   |
| row (avatar + name + follow button). Caption text. Action row:        |
| LikeButton + comment count + share + report (3-dot menu). Comments    |
| section starts below.                                                 |
|                                                                       |
| Comments: FlatList. Top-level comments show replies below them        |
| (indented, max 1 level). Each comment: avatar + username + body +     |
| reply button + timestamp + delete (own comments only). Input bar at   |
| bottom of screen, floats above keyboard (KeyboardAvoidingView).       |
|                                                                       |
| APIs: GET /posts/:id · GET /posts/:postId/comments · POST             |
| /posts/:postId/comments { body, parent_id? } · DELETE                 |
| /posts/:postId/comments/:id                                           |
+-----------------------------------------------------------------------+

  --------- ------------------------------------------------------------------
  **4.5**   **src/components/FollowButton.tsx --- reusable**

  --------- ------------------------------------------------------------------

+-----------------------------------------------------------------------+
| // src/components/FollowButton.tsx                                    |
|                                                                       |
| import { useMutation, useQuery, useQueryClient } from                 |
| \'@tanstack/react-query\';                                            |
|                                                                       |
| import { TouchableOpacity, Text, ActivityIndicator } from             |
| \'react-native\';                                                     |
|                                                                       |
| import { apiClient } from \'../lib/apiClient\';                       |
|                                                                       |
| import { useAuthStore } from \'../stores/authStore\';                 |
|                                                                       |
| export function FollowButton({ userId }: { userId: string }) {        |
|                                                                       |
| const qc = useQueryClient();                                          |
|                                                                       |
| const { user } = useAuthStore();                                      |
|                                                                       |
| // Don\'t show for own profile                                        |
|                                                                       |
| if (user?.id === userId) return null;                                 |
|                                                                       |
| const { data: rel } = useQuery({                                      |
|                                                                       |
| queryKey: \[\'relationship\', userId\],                               |
|                                                                       |
| queryFn: () =\>                                                       |
| apiClient.get(\`/follows/\${userId}/relationship\`).then(r =\>        |
| r.data),                                                              |
|                                                                       |
| });                                                                   |
|                                                                       |
| const isFollowing = rel?.you_follow_them ?? false;                    |
|                                                                       |
| const mutation = useMutation({                                        |
|                                                                       |
| mutationFn: () =\> isFollowing                                        |
|                                                                       |
| ? apiClient.delete(\`/follows/\${userId}\`)                           |
|                                                                       |
| : apiClient.post(\`/follows/\${userId}\`),                            |
|                                                                       |
| onSuccess: () =\> {                                                   |
|                                                                       |
| qc.invalidateQueries({ queryKey: \[\'relationship\', userId\] });     |
|                                                                       |
| qc.invalidateQueries({ queryKey: \[\'my-profile\'\] });               |
|                                                                       |
| qc.invalidateQueries({ queryKey: \[\'feed\', \'home\'\] });           |
|                                                                       |
| },                                                                    |
|                                                                       |
| });                                                                   |
|                                                                       |
| return (                                                              |
|                                                                       |
| \<TouchableOpacity                                                    |
|                                                                       |
| onPress={() =\> mutation.mutate()}                                    |
|                                                                       |
| disabled={mutation.isPending}                                         |
|                                                                       |
| className={isFollowing                                                |
|                                                                       |
| ? \'bg-white/10 rounded-full px-4 py-2 border border-white/20\'       |
|                                                                       |
| : \'bg-\[#FF6B35\] rounded-full px-4 py-2\'                           |
|                                                                       |
| }                                                                     |
|                                                                       |
| activeOpacity={0.8}                                                   |
|                                                                       |
| \>                                                                    |
|                                                                       |
| {mutation.isPending                                                   |
|                                                                       |
| ? \<ActivityIndicator size=\'small\' color=\'#FFFFFF\' /\>            |
|                                                                       |
| : \<Text style={{ fontFamily: \'HelveticaNeue-Medium\' }}             |
| className=\'text-white text-sm\'\>                                    |
|                                                                       |
| {isFollowing ? \'Following\' : \'Follow\'}                            |
|                                                                       |
| \</Text\>                                                             |
|                                                                       |
| }                                                                     |
|                                                                       |
| \</TouchableOpacity\>                                                 |
|                                                                       |
| );                                                                    |
|                                                                       |
| }                                                                     |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **✅ Phase 4 Complete When:**                                         |
|                                                                       |
| ☑ home.tsx shows real posts with infinite scroll --- no more          |
| feedCards array                                                       |
|                                                                       |
| ☑ Trending toggle switches to GET /feed/trending                      |
|                                                                       |
| ☑ Like toggles optimistically (instant UI response)                   |
|                                                                       |
| ☑ create-post.tsx creates real posts and they appear in feed          |
|                                                                       |
| ☑ post-detail.tsx shows comments, can add/delete comments             |
|                                                                       |
| ☑ FollowButton works from profile, post detail, and anywhere else it  |
| appears                                                               |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **PHASE 5**                                                           |
|                                                                       |
| **Marketplace --- Vendor, Products, Cart, Orders**                    |
|                                                                       |
| *Vendor registration · Catalog · Product detail · Cart · Checkout ·   |
| Order tracking*                                                       |
+-----------------------------------------------------------------------+

  --------- ------------------------------------------------------------------
  **5.1**   **Wire up vendor-registration.tsx --- remove AsyncStorage mock**

  --------- ------------------------------------------------------------------

+-----------------------------------------------------------------------+
| // app/vendor/registration.tsx                                        |
|                                                                       |
| // DELETE everything that writes to VendorContext / AsyncStorage      |
|                                                                       |
| // REPLACE with:                                                      |
|                                                                       |
| const registerMutation = useMutation({                                |
|                                                                       |
| mutationFn: (body: any) =\> apiClient.post(\'/vendors/register\',     |
| body),                                                                |
|                                                                       |
| onSuccess: () =\> router.replace(\'/vendor/pending\'),                |
|                                                                       |
| onError: (err: any) =\> setError(err.response?.data?.error \|\|       |
| \'Registration failed.\'),                                            |
|                                                                       |
| });                                                                   |
|                                                                       |
| // Add a \'Pending Approval\' screen (app/vendor/pending.tsx):        |
|                                                                       |
| // Show: \'Your vendor application is under review. We\'ll notify you |
| once approved.\'                                                      |
|                                                                       |
| // Include: shop name, status badge (PENDING - orange), back to home  |
| button                                                                |
+-----------------------------------------------------------------------+

  --------- ------------------------------------------------------------------
  **5.2**   **Wire up vendor/dashboard.tsx with real stats**

  --------- ------------------------------------------------------------------

+-----------------------------------------------------------------------+
| // app/vendor/dashboard.tsx                                           |
|                                                                       |
| const { data } = useQuery({                                           |
|                                                                       |
| queryKey: \[\'vendor-stats\'\],                                       |
|                                                                       |
| queryFn: () =\> apiClient.get(\'/vendors/me/stats\').then(r =\>       |
| r.data),                                                              |
|                                                                       |
| });                                                                   |
|                                                                       |
| // Replace hardcoded metric cards with:                               |
|                                                                       |
| // Total Revenue: data?.summary?.total_revenue ?? 0                   |
|                                                                       |
| // Total Sales: data?.summary?.total_sales ?? 0                       |
|                                                                       |
| // Products: data?.summary?.products_count ?? 0                       |
|                                                                       |
| // Avg Rating: data?.summary?.avg_rating ?? 0                         |
|                                                                       |
| // Recent orders list: data?.recent_orders ?? \[\]                    |
|                                                                       |
| // Orders by status: data?.orders_by_status ?? {}                     |
+-----------------------------------------------------------------------+

  --------- ------------------------------------------------------------------
  **5.3**   **Create app/(tabs)/shop/catalog.tsx --- product browse**

  --------- ------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **📱 catalog.tsx**                                                    |
|                                                                       |
| Layout: Header with search bar (Ionicons search icon, white/10 bg).   |
| Filter bar below: horizontal ScrollView of category chips (All, Tops, |
| Bottoms, etc. --- each a pill, active = #FF6B35 bg, inactive =        |
| white/10). Price range + Sort bottom sheet accessible via filter      |
| icon.                                                                 |
|                                                                       |
| Products grid: 2-column FlatList. Each card: image (aspect 1:1,       |
| rounded-2xl), name (HelveticaNeue-Medium), price (HelveticaNeue-Thin, |
| large), vendor name (white/40), condition badge. Resale items:        |
| \'Preloved\' badge (orange outline).                                  |
|                                                                       |
| Infinite scroll with useInfiniteQuery. 500ms debounce on search       |
| input.                                                                |
|                                                                       |
| API: GET                                                              |
| /produc                                                               |
| ts?page=N&limit=20&category=X&search=Y&sort=Z&min_price=A&max_price=B |
+-----------------------------------------------------------------------+

  --------- ------------------------------------------------------------------
  **5.4**   **Create app/(tabs)/shop/product-detail.tsx**

  --------- ------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **📱 product-detail.tsx**                                             |
|                                                                       |
| Layout: Full-screen product image at top (with image gallery dots if  |
| multiple). Scrollable content below: product name                     |
| (HelveticaNeue-Bold), price (large, HelveticaNeue-Light), vendor row  |
| (logo + name → tap to go to vendor profile), condition + category     |
| chips, description, attributes from ai_attributes.                    |
|                                                                       |
| Bottom bar: fixed at bottom --- stock indicator + \'Add to Cart\'     |
| button (#FF6B35 full width). Disable if stock = 0 (show \'Out of      |
| Stock\').                                                             |
|                                                                       |
| APIs: GET /products/:id · POST /cart/items { product_id, quantity: 1  |
| }. On add to cart: update useCartStore count + show toast \'Added to  |
| cart\'.                                                               |
+-----------------------------------------------------------------------+

  --------- ------------------------------------------------------------------
  **5.5**   **Create app/(tabs)/shop/cart.tsx**

  --------- ------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **📱 cart.tsx**                                                       |
|                                                                       |
| Layout: FlatList of cart items. Each row: product image (60x60        |
| rounded-xl), name + vendor name, price, quantity stepper (minus/plus  |
| buttons with current count), delete button (trash icon, red/80).      |
|                                                                       |
| Footer (sticky): Subtotal label + amount (HelveticaNeue-Light,        |
| large). If unavailable_count \> 0: warning banner \'X items in your   |
| cart are no longer available and have been removed\'. \'Proceed to    |
| Checkout\' primary button.                                            |
|                                                                       |
| Empty state: Ionicons bag-outline (large, white/20), \'Your cart is   |
| empty\', \'Browse Products\' link button.                             |
|                                                                       |
| APIs: GET /cart · PATCH /cart/items/:id { quantity } · DELETE         |
| /cart/items/:id · DELETE /cart. Sync count to useCartStore after each |
| mutation.                                                             |
+-----------------------------------------------------------------------+

  --------- ------------------------------------------------------------------
  **5.6**   **Create app/(tabs)/shop/checkout.tsx**

  --------- ------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **📱 checkout.tsx**                                                   |
|                                                                       |
| Layout: ScrollView. Section \'Delivery Details\': Address (text       |
| input), City (text input), Phone (phone input), Notes (multiline,     |
| optional). Section \'Order Summary\': list of items with prices,      |
| subtotal. Section \'Payment\': single row \'Cash on Delivery\' with   |
| info icon.                                                            |
|                                                                       |
| Multi-vendor notice: if cart has items from 2+ vendors, show banner:  |
| \'Your order will be split into 2 separate orders --- one per vendor. |
| You pay each vendor separately on delivery.\'                         |
|                                                                       |
| \'Place Order\' button: disabled until all required fields filled.    |
| Shows spinner on tap. On success: navigate to order confirmation      |
| screen, clear cart store badge.                                       |
|                                                                       |
| API: POST /orders { delivery_address, delivery_city, delivery_phone,  |
| delivery_notes? }. Returns { orders: \[\...\], count: N }.            |
+-----------------------------------------------------------------------+

  --------- ------------------------------------------------------------------
  **5.7**   **Create app/orders/buyer.tsx + app/vendor/orders.tsx**

  --------- ------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **📱 buyer.tsx + vendor/orders.tsx**                                  |
|                                                                       |
| Buyer view: List of orders (newest first). Each row: order ID         |
| (short), date, vendor name, total, status badge (colour-coded:        |
| pending=orange, confirmed=blue, shipped=purple, delivered=green,      |
| cancelled=red). Tap to expand: shows order items list + delivery      |
| address + action (Cancel if pending).                                 |
|                                                                       |
| Vendor view: Tab bar at top with status filter pills (All / Pending / |
| Confirmed / Shipped). Each order row: buyer name + order items        |
| count + total + action button. Action button changes per status:      |
| \'Confirm\' (pending) / \'Mark Shipped\' (confirmed) / \'Mark         |
| Delivered\' (shipped).                                                |
|                                                                       |
| Buyer APIs: GET /orders · PATCH /orders/:id/cancel. Vendor APIs: GET  |
| /orders/vendor?status=X · PATCH /orders/:id/confirm\|ship\|deliver.   |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **✅ Phase 5 Complete When:**                                         |
|                                                                       |
| ☑ Vendor registration POSTs to backend (no more AsyncStorage mock)    |
|                                                                       |
| ☑ Vendor dashboard shows real revenue, sales, orders from API         |
|                                                                       |
| ☑ catalog.tsx browses real products with search + category filter     |
|                                                                       |
| ☑ product-detail.tsx shows full product + add to cart works           |
|                                                                       |
| ☑ cart.tsx shows real cart items, quantity update and remove work     |
|                                                                       |
| ☑ checkout.tsx places real COD order                                  |
|                                                                       |
| ☑ Buyer and vendor order screens show real order status               |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **PHASE 6**                                                           |
|                                                                       |
| **Production Polish --- App Store Ready**                             |
|                                                                       |
| *Error boundary · Deep links · Loading skeletons · Empty states ·     |
| Offline handling · Final cleanup*                                     |
+-----------------------------------------------------------------------+

  --------- ------------------------------------------------------------------
  **6.1**   **Global ErrorBoundary --- prevents white screen crashes**

  --------- ------------------------------------------------------------------

+-----------------------------------------------------------------------+
| // src/components/ErrorBoundary.tsx                                   |
|                                                                       |
| import React from \'react\';                                          |
|                                                                       |
| import { View, Text, TouchableOpacity } from \'react-native\';        |
|                                                                       |
| interface State { hasError: boolean; }                                |
|                                                                       |
| export class ErrorBoundary extends React.Component\<                  |
|                                                                       |
| { children: React.ReactNode },                                        |
|                                                                       |
| State                                                                 |
|                                                                       |
| \> {                                                                  |
|                                                                       |
| state: State = { hasError: false };                                   |
|                                                                       |
| static getDerivedStateFromError() { return { hasError: true }; }      |
|                                                                       |
| componentDidCatch(error: Error) {                                     |
|                                                                       |
| console.error(\'\[ErrorBoundary\]\', error);                          |
|                                                                       |
| }                                                                     |
|                                                                       |
| render() {                                                            |
|                                                                       |
| if (!this.state.hasError) return this.props.children;                 |
|                                                                       |
| return (                                                              |
|                                                                       |
| \<View className=\'flex-1 bg-black items-center justify-center        |
| px-8\'\>                                                              |
|                                                                       |
| \<Text style={{ fontFamily: \'HelveticaNeue-Bold\' }}                 |
| className=\'text-white text-xl mb-3\'\>                               |
|                                                                       |
| Something went wrong                                                  |
|                                                                       |
| \</Text\>                                                             |
|                                                                       |
| \<Text className=\'text-white/60 text-center mb-8\'\>                 |
|                                                                       |
| Please restart the app. If the issue persists, contact support.       |
|                                                                       |
| \</Text\>                                                             |
|                                                                       |
| \<TouchableOpacity                                                    |
|                                                                       |
| className=\'bg-\[#FF6B35\] px-8 py-3 rounded-full\'                   |
|                                                                       |
| onPress={() =\> this.setState({ hasError: false })}                   |
|                                                                       |
| \>                                                                    |
|                                                                       |
| \<Text style={{ fontFamily: \'HelveticaNeue-Heavy\' }}                |
| className=\'text-white\'\>                                            |
|                                                                       |
| TRY AGAIN                                                             |
|                                                                       |
| \</Text\>                                                             |
|                                                                       |
| \</TouchableOpacity\>                                                 |
|                                                                       |
| \</View\>                                                             |
|                                                                       |
| );                                                                    |
|                                                                       |
| }                                                                     |
|                                                                       |
| }                                                                     |
|                                                                       |
| // Wrap in \_layout.tsx:                                              |
|                                                                       |
| // \<ErrorBoundary\>\<AuthGuard /\>\</ErrorBoundary\>                 |
+-----------------------------------------------------------------------+

  --------- ------------------------------------------------------------------
  **6.2**   **Skeleton loading components --- no blank screens**

  --------- ------------------------------------------------------------------

+-----------------------------------------------------------------------+
| // src/components/Skeleton.tsx                                        |
|                                                                       |
| import { View } from \'react-native\';                                |
|                                                                       |
| import Animated, { useSharedValue, useAnimatedStyle,                  |
|                                                                       |
| withRepeat, withTiming } from \'react-native-reanimated\';            |
|                                                                       |
| import { useEffect } from \'react\';                                  |
|                                                                       |
| export function Skeleton({ className }: { className?: string }) {     |
|                                                                       |
| const opacity = useSharedValue(0.3);                                  |
|                                                                       |
| useEffect(() =\> {                                                    |
|                                                                       |
| opacity.value = withRepeat(withTiming(0.7, { duration: 800 }), -1,    |
| true);                                                                |
|                                                                       |
| }, \[\]);                                                             |
|                                                                       |
| const style = useAnimatedStyle(() =\> ({ opacity: opacity.value }));  |
|                                                                       |
| return (                                                              |
|                                                                       |
| \<Animated.View                                                       |
|                                                                       |
| style={style}                                                         |
|                                                                       |
| className={\`bg-white/20 rounded-xl \${className ?? \'\'}\`}          |
|                                                                       |
| /\>                                                                   |
|                                                                       |
| );                                                                    |
|                                                                       |
| }                                                                     |
|                                                                       |
| // Usage in wardrobe.tsx when isLoading:                              |
|                                                                       |
| // \<View className=\'flex-row flex-wrap gap-2\'\>                    |
|                                                                       |
| // {Array(6).fill(0).map((\_, i) =\> (                                |
|                                                                       |
| // \<Skeleton key={i} className=\'w-\[48%\] aspect-square\' /\>       |
|                                                                       |
| // ))}                                                                |
|                                                                       |
| // \</View\>                                                          |
+-----------------------------------------------------------------------+

  --------- ------------------------------------------------------------------
  **6.3**   **Empty states --- every list needs one**

  --------- ------------------------------------------------------------------

+-----------------------------------------------------------------------+
| // src/components/EmptyState.tsx                                      |
|                                                                       |
| import { View, Text, TouchableOpacity } from \'react-native\';        |
|                                                                       |
| import { Ionicons } from \'@expo/vector-icons\';                      |
|                                                                       |
| interface Props {                                                     |
|                                                                       |
| icon: keyof typeof Ionicons.glyphMap;                                 |
|                                                                       |
| title: string;                                                        |
|                                                                       |
| subtitle?: string;                                                    |
|                                                                       |
| actionLabel?: string;                                                 |
|                                                                       |
| onAction?: () =\> void;                                               |
|                                                                       |
| }                                                                     |
|                                                                       |
| export function EmptyState({ icon, title, subtitle, actionLabel,      |
| onAction }: Props) {                                                  |
|                                                                       |
| return (                                                              |
|                                                                       |
| \<View className=\'flex-1 items-center justify-center px-8 py-16\'\>  |
|                                                                       |
| \<Ionicons name={icon} size={64} color=\'rgba(255,255,255,0.15)\' /\> |
|                                                                       |
| \<Text style={{ fontFamily: \'HelveticaNeue-Bold\' }}                 |
|                                                                       |
| className=\'text-white text-xl mt-4 text-center\'\>                   |
|                                                                       |
| {title}                                                               |
|                                                                       |
| \</Text\>                                                             |
|                                                                       |
| {subtitle && (                                                        |
|                                                                       |
| \<Text className=\'text-white/40 text-center                          |
| mt-2\'\>{subtitle}\</Text\>                                           |
|                                                                       |
| )}                                                                    |
|                                                                       |
| {actionLabel && onAction && (                                         |
|                                                                       |
| \<TouchableOpacity                                                    |
|                                                                       |
| className=\'mt-6 bg-\[#FF6B35\] px-8 py-3 rounded-full\'              |
|                                                                       |
| onPress={onAction}                                                    |
|                                                                       |
| activeOpacity={0.8}                                                   |
|                                                                       |
| \>                                                                    |
|                                                                       |
| \<Text style={{ fontFamily: \'HelveticaNeue-Heavy\' }}                |
| className=\'text-white\'\>                                            |
|                                                                       |
| {actionLabel}                                                         |
|                                                                       |
| \</Text\>                                                             |
|                                                                       |
| \</TouchableOpacity\>                                                 |
|                                                                       |
| )}                                                                    |
|                                                                       |
| \</View\>                                                             |
|                                                                       |
| );                                                                    |
|                                                                       |
| }                                                                     |
|                                                                       |
| // Wardrobe empty: icon=\'shirt-outline\' title=\'Your wardrobe is    |
| empty\'                                                               |
|                                                                       |
| // actionLabel=\'Add First Item\' onAction={() =\>                    |
| router.push(\'/wardrobe/item-upload\')}                               |
|                                                                       |
| // Cart empty: icon=\'bag-outline\' title=\'Your cart is empty\'      |
|                                                                       |
| // actionLabel=\'Browse Products\' onAction={() =\>                   |
| router.push(\'/shop/catalog\')}                                       |
|                                                                       |
| // Feed empty: icon=\'people-outline\' title=\'Follow people to see   |
| their posts\'                                                         |
+-----------------------------------------------------------------------+

  --------- ------------------------------------------------------------------
  **6.4**   **app.json --- Apple required permissions + metadata**

  --------- ------------------------------------------------------------------

+-----------------------------------------------------------------------+
| // app.json --- add inside \'expo\' object                            |
|                                                                       |
| {                                                                     |
|                                                                       |
| \'expo\': {                                                           |
|                                                                       |
| \'ios\': {                                                            |
|                                                                       |
| \'infoPlist\': {                                                      |
|                                                                       |
| \'NSPhotoLibraryUsageDescription\': \'Wearism needs photo access to   |
| upload wardrobe items and post images.\',                             |
|                                                                       |
| \'NSCameraUsageDescription\': \'Wearism needs camera access to        |
| photograph wardrobe items.\',                                         |
|                                                                       |
| \'NSUserNotificationsUsageDescription\': \'Wearism sends              |
| notifications for likes, follows, and order updates.\',               |
|                                                                       |
| \'NSLocationWhenInUseUsageDescription\': \'Used to suggest nearby     |
| vendors.\'                                                            |
|                                                                       |
| }                                                                     |
|                                                                       |
| },                                                                    |
|                                                                       |
| \'android\': {                                                        |
|                                                                       |
| \'permissions\': \[                                                   |
|                                                                       |
| \'READ_MEDIA_IMAGES\',                                                |
|                                                                       |
| \'CAMERA\',                                                           |
|                                                                       |
| \'RECEIVE_BOOT_COMPLETED\',                                           |
|                                                                       |
| \'VIBRATE\'                                                           |
|                                                                       |
| \]                                                                    |
|                                                                       |
| }                                                                     |
|                                                                       |
| }                                                                     |
|                                                                       |
| }                                                                     |
+-----------------------------------------------------------------------+

  --------- ------------------------------------------------------------------
  **6.5**   **Final cleanup checklist before App Store submission**

  --------- ------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **⚠️ Important**                                                      |
|                                                                       |
| Remove ALL hardcoded data arrays: feedCards, weeklyOutfits,           |
| wardrobeCategories, profilePosts, any other mock arrays. Apple        |
| reviewers will test actual flows.                                     |
|                                                                       |
| All console.log() calls removed or replaced with proper logging.      |
| Never log auth tokens.                                                |
|                                                                       |
| VendorContext --- remove all AsyncStorage mock data and replace with  |
| real API calls. The context can stay as a lightweight state holder    |
| but must not simulate authentication.                                 |
|                                                                       |
| Privacy Policy URL: must be a real accessible URL. Add to App Store   |
| listing and inside Settings screen.                                   |
|                                                                       |
| Test on real devices (not just simulator) --- image picker and push   |
| notifications behave differently on physical iOS/Android devices.     |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **✅ Phase 6 Complete When:**                                         |
|                                                                       |
| ☑ App does not white-screen crash on any error --- ErrorBoundary      |
| catches everything                                                    |
|                                                                       |
| ☑ Every list screen has a skeleton loader and an empty state          |
|                                                                       |
| ☑ No hardcoded mock data arrays remain anywhere in the codebase       |
|                                                                       |
| ☑ app.json has all required iOS permission strings                    |
|                                                                       |
| ☑ Settings screen has Delete Account + Privacy Policy + Logout        |
|                                                                       |
| ☑ Tested on real iPhone AND Android device                            |
+-----------------------------------------------------------------------+

**Master Completion Checklist**

Tick every item across all 6 phases before submitting to App Store.

  --------------------- -------------------------------------------------
  **Phase**             **Scope**

  **Phase 1 ---         apiClient.ts · authStore.ts · \_layout.tsx
  Foundation**          AuthGuard · login wired · signup wired ·
                        forgot-password screen · FCM token registration

  **Phase 2 ---         profile.tsx real data · edit-profile.tsx · avatar
  Profile**             upload · settings screen with delete account

  **Phase 3 ---         wardrobe.tsx real items · item-upload.tsx ·
  Wardrobe**            item-detail.tsx + AI polling · outfit-create.tsx
                        · recommendations wired

  **Phase 4 ---         home.tsx infinite scroll · trending toggle ·
  Social**              LikeButton optimistic · create-post.tsx ·
                        post-detail.tsx + comments · FollowButton
                        component

  **Phase 5 ---         vendor registration real API · dashboard stats
  Marketplace**         real · catalog.tsx · product-detail.tsx ·
                        cart.tsx · checkout.tsx · buyer orders · vendor
                        orders

  **Phase 6 ---         ErrorBoundary · Skeleton components · EmptyState
  Polish**              components · app.json permissions · all mock
                        arrays removed · tested on real device
  --------------------- -------------------------------------------------

**Build in order. Don\'t skip phases. Foundation first --- everything
else depends on it.**
