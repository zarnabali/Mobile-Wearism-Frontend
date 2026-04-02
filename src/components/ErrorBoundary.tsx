import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
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
            onPress={() => this.setState({ hasError: false })}
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
