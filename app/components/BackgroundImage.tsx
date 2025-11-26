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
    backgroundImage = require('../../assets/background/img1.jpg');
  } catch (error) {
    // Image not found
    backgroundImage = null;
  }

  // Always start with gradient background to prevent white flash
  const gradientBg = (
    <LinearGradient
      colors={['#1e293b', '#0f172a', '#020617']}
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
          colors={['rgba(15, 23, 42, 0.4)', 'rgba(2, 6, 23, 0.2)', 'transparent']}
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
