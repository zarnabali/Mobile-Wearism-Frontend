import { useEffect, useState } from 'react';
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';

interface IPDetectionResult {
  ip: string;
  port: string;
  baseUrl: string;
}

export const useIPDetection = () => {
  const [result, setResult] = useState<IPDetectionResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    detectIPAndPort();
  }, []);

  const detectIPAndPort = async () => {
    try {
      setLoading(true);

      // Get backend port from environment or use default
      const backendPort = process.env.EXPO_PUBLIC_BACKEND_PORT || '3000';

      let detectedIP = 'localhost';

      if (Platform.OS !== 'web') {
        try {
          // Try to get local IP from Expo constants
          // For development, this should work on both iOS and Android
          const ipAddress = Constants.expoConfig?.hostUri;
          
          if (ipAddress) {
            // Extract IP from hostUri (e.g., "192.168.1.100:8081" -> "192.168.1.100")
            detectedIP = ipAddress.split(':')[0];
          } else {
            // Fallback: try to get from debuggerHost
            const debuggerHost = Constants.expoConfig?.extra?.debuggerHost;
            if (debuggerHost) {
              detectedIP = debuggerHost.split(':')[0];
            }
          }

          // If still localhost and we're on device, show instructions
          if (detectedIP === 'localhost' || detectedIP === '127.0.0.1') {
            // On physical device, we need the computer's local IP
            Alert.alert(
              'Network Setup Required',
              `To connect to your backend, you need to:\n\n1. Find your computer's IP address:\n   - Run: ipconfig (Windows) or ifconfig (Mac/Linux)\n   - Look for IPv4 address (e.g., 192.168.1.100)\n\n2. Update API_BASE_URL in .env file\n\n3. Restart Expo`,
              [{ text: 'OK' }]
            );
            detectedIP = 'localhost'; // Fallback to localhost for web simulator
          }
        } catch (error) {
          console.warn('Could not detect IP automatically:', error);
          detectedIP = 'localhost';
        }
      }

      const baseUrl = `http://${detectedIP}:${backendPort}`;

      setResult({
        ip: detectedIP,
        port: backendPort,
        baseUrl,
      });

      console.log('🔗 Backend URL:', baseUrl);
    } catch (error) {
      console.error('IP detection error:', error);
      // Fallback to localhost
      setResult({
        ip: 'localhost',
        port: backendPort,
        baseUrl: `http://localhost:${backendPort}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return { result, loading, refetch: detectIPAndPort };
};

export const getBackendURL = () => {
  const backendPort = process.env.EXPO_PUBLIC_BACKEND_PORT || '3000';
  
  // For development on simulator/emulator
  if (Platform.OS === 'android') {
    // Android emulator uses 10.0.2.2 to access host machine
    return `http://10.0.2.2:${backendPort}`;
  }
  
  // For iOS simulator, use localhost
  if (Platform.OS === 'ios') {
    // iOS simulator can use localhost
    return `http://localhost:${backendPort}`;
  }
  
  // For web
  return `http://localhost:${backendPort}`;
};

export default useIPDetection;

