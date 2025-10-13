import React from 'react';
import { View, ImageBackground, StyleSheet } from 'react-native';

interface BackgroundImageProps {
  children: React.ReactNode;
  imageSource?: any;
}

const BackgroundImage: React.FC<BackgroundImageProps> = ({ children, imageSource }) => {
  // Try to load the background image
  try {
    const backgroundImage = require('../../assets/background/img1.jpg');
    return (
      <ImageBackground
        source={backgroundImage}
        style={styles.container}
        resizeMode="cover"
      >
        {children}
      </ImageBackground>
    );
  } catch (error) {
    // If image not found, use a simple dark background
    return (
      <View style={[styles.container, { backgroundColor: '#1e293b' }]}>
        {children}
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default BackgroundImage;
