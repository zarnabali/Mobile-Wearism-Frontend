import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const ModeSwitchOverlay = () => {
  return (
    <Animated.View 
      entering={FadeIn.duration(400)} 
      exiting={FadeOut.duration(400)}
      style={StyleSheet.absoluteFill}
    >
      <LinearGradient
        colors={['#1e0004', '#000000']}
        style={styles.container}
      >
        <View style={styles.content}>
          <Text style={styles.poweredBy}>powered BY</Text>
          <Image
            source={require('../../assets/logo/wearism-w.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <ActivityIndicator 
            color="#FF6B35" 
            size="small" 
            style={{ marginTop: 24 }} 
          />
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  content: {
    alignItems: 'center',
  },
  poweredBy: {
    fontSize: 10,
    fontFamily: 'HelveticaNeue-Light',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginBottom: 8,
  },
  logo: {
    width: width * 0.4,
    height: 40,
  },
});

export default ModeSwitchOverlay;
