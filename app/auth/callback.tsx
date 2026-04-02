import { useEffect, useState } from "react";
import { View, ActivityIndicator, Alert, Text } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { apiClient } from "../../src/lib/apiClient";
import { useAuthStore } from "../../src/stores/authStore";

export default function AuthCallback() {
  const router = useRouter();
  
  // Expo Router automatically parses deep link query parameters!
  const params = useLocalSearchParams();
  const token_hash = params.token_hash as string;
  const type = params.type as string;

  const [hasVerified, setHasVerified] = useState(false);

  useEffect(() => {
    // Only attempt verification if we have the params and haven't verified yet
    if (!token_hash || !type || hasVerified) return;

    const handleVerification = async () => {
      setHasVerified(true);
      try {
        
        // This hits the backend which runs supabase.auth.verifyOtp({ token_hash, type })
        const { data } = await apiClient.get("/auth/verify", {
          params: { token_hash, type },
        });

        if (data.success && data.session) {
          // Save session exactly the same way login does in authStore
          await Promise.all([
            SecureStore.setItemAsync("access_token", data.session.access_token),
            SecureStore.setItemAsync("refresh_token", data.session.refresh_token),
            SecureStore.setItemAsync("user", JSON.stringify(data.user)),
          ]);

          // Update Zustand store
          useAuthStore.setState({ 
            user: data.user, 
            isSignedIn: true,
            isLoading: false 
          });

          // Redirect user based on the action type
          if (type === "recovery") {
            router.replace("/reset-password" as any);
          } else {
            router.replace("/home");
          }
        } else {
          router.replace("/login");
        }
      } catch (err: any) {
        console.error("Callback error:", err);
        Alert.alert("Verification Error", err.response?.data?.error || "Could not verify email.");
        router.replace("/login");
      }
    };

    handleVerification();
  }, [token_hash, type, hasVerified, router]);

  // If no params are present at all (just opened the screen directly), you can bounce them
  useEffect(() => {
    if (!token_hash || !type) {
      // Small delay just to prevent rapid flash routing if params take a tick to parse
      const timer = setTimeout(() => {
        if (!token_hash || !type) {
          router.replace("/login");
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [token_hash, type, router]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#000' }}>
      <ActivityIndicator size="large" color="#FF6B35" />
      <Text style={{ color: "white", marginTop: 16 }}>Verifying your email...</Text>
    </View>
  );
}
