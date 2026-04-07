import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: any): State {
    // null/undefined = React Fast Refresh reconciler bailout, not a real crash.
    // Returning hasError: false means the boundary stays invisible and the
    // screen continues normally — which is the correct behaviour in Expo Go.
    if (error == null) return { hasError: false };
    return { hasError: true };
  }

  componentDidCatch(error: any, info: React.ErrorInfo) {
    // Ignore the Fast Refresh null-error blips entirely.
    if (error == null) return;

    console.error('[ErrorBoundary]', error?.message);
    if (error?.stack) console.error('[ErrorBoundary stack]', error.stack);
    console.error('[ErrorBoundary componentStack]', info?.componentStack);
    try {
      console.error(
        '[FULL ERROR OBJECT]',
        JSON.stringify(error, Object.getOwnPropertyNames(error))
      );
    } catch {
      // ignore
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 20, textAlign: 'center', marginBottom: 8 }}>
            Something went wrong
          </Text>
          <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', marginBottom: 32 }}>
            An unexpected error occurred. Please try again.
          </Text>
          <TouchableOpacity
            onPress={() => {
              this.setState({ hasError: false });
              // If router isn't ready yet, don't crash the fallback UI.
              try {
                router.replace('/home');
              } catch {
                // no-op
              }
            }}
            style={{ backgroundColor: '#FF6B35', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 999 }}
          >
            <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 16 }}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}