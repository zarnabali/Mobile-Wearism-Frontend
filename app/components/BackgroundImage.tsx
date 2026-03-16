import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface BackgroundImageProps {
  children: React.ReactNode;
  imageSource?: any;
}

const BackgroundImage: React.FC<BackgroundImageProps> = ({ children, imageSource }) => {
  // Try to load the background image
  let backgroundImage;
  try {
    backgroundImage = require('../../assets/background/download(25).jpeg');
  } catch (error) {
    // Image not found
    backgroundImage = null;
  }

  // Always start with gradient background to prevent white flash
  const gradientBg = (
    <LinearGradient
      colors={['#3C0008', '#2A0005', '#1A0003']}
      style={StyleSheet.absoluteFillObject}
    />
  );

  // Error state or no image - use gradient background only
  if (!backgroundImage) {
    return (
      <View style={styles.container}>
        {gradientBg}
        {children}
      </View>
    );
  }

  // Image available - render image with gradient as underlay
  return (
    <View style={styles.container}>
      {gradientBg}
      <ImageBackground
        source={backgroundImage}
        style={styles.container}
        resizeMode="cover"
        imageStyle={{ opacity: 0.85 }}
      >
        {/* Additional gradient overlay for better text readability */}
        <LinearGradient
          colors={['rgba(60, 0, 8, 0.5)', 'rgba(42, 0, 5, 0.3)', 'transparent']}
          style={styles.overlay}
        >
          {children}
        </LinearGradient>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
});

export default BackgroundImage;
