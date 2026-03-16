import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export interface CarouselItem {
  backgroundImage: any;
  title1: string;
  title2: string;
  featureText: string;
}

interface ImageCarouselProps {
  items: CarouselItem[];
  autoPlayInterval?: number;
  onIndexChange?: (index: number) => void;
}

const ImageCarousel = ({
  items,
  autoPlayInterval = 4000,
  onIndexChange,
}: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const imageScrollRef = useRef<ScrollView>(null);
  const textScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % items.length;
        
        // Sync both scroll views
        if (imageScrollRef.current) {
          imageScrollRef.current.scrollTo({
            x: nextIndex * width,
            animated: true,
          });
        }
        if (textScrollRef.current) {
          textScrollRef.current.scrollTo({
            x: nextIndex * width,
            animated: true,
          });
        }
        
        if (onIndexChange) {
          onIndexChange(nextIndex);
        }
        
        return nextIndex;
      });
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [items.length, autoPlayInterval, onIndexChange]);

  const handleImageScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const index = Math.round(contentOffset.x / width);
    setCurrentIndex(index);
    
    // Sync text scroll with image scroll
    if (textScrollRef.current) {
      textScrollRef.current.scrollTo({
        x: index * width,
        animated: false,
      });
    }
    
    if (onIndexChange) {
      onIndexChange(index);
    }
  };

  const handleTextScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const index = Math.round(contentOffset.x / width);
    setCurrentIndex(index);
    
    // Sync image scroll with text scroll
    if (imageScrollRef.current) {
      imageScrollRef.current.scrollTo({
        x: index * width,
        animated: false,
      });
    }
    
    if (onIndexChange) {
      onIndexChange(index);
    }
  };

  const renderDots = () => {
    return (
      <View className="flex-row justify-start items-start mt-2 mb-4">
        {items.map((_, index) => (
          <View
            key={index}
            className={`w-2 h-2 rounded-full mx-1 ${
              index === currentIndex ? 'bg-orange-400' : 'bg-white/40'
            }`}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Background Image Carousel */}
      <ScrollView
        ref={imageScrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleImageScroll}
        scrollEventThrottle={16}
        style={styles.imageScroll}
      >
        {items.map((item, index) => (
          <ImageBackground
            key={index}
            source={item.backgroundImage}
            style={styles.imageBackground}
            resizeMode="cover"
          >
            <LinearGradient
              // Slightly lighter overlay to let more of the background image show
              colors={['rgba(60, 0, 8, 0.45)', 'rgba(60, 0, 8, 0.30)', 'rgba(60, 0, 8, 0.55)']}
              style={styles.gradientOverlay}
            />
          </ImageBackground>
        ))}
      </ScrollView>

      {/* Text Content Carousel */}
      <View style={styles.textContainer}>
        <ScrollView
          ref={textScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleTextScroll}
          scrollEventThrottle={16}
          style={styles.textScroll}
        >
          {items.map((item, index) => (
            <View key={index} style={[styles.textSlide, { width }]}>
              <Text
                className="text-white text-4xl font-light leading-tight mb-0 pb-0"
                style={{ fontFamily: 'HelveticaNeue-Light' }}
              >
                {item.title1}
              </Text>
              <Text
                className="text-orange-400 text-4xl font-light leading-tight"
                style={{ fontFamily: 'HelveticaNeue-Light' }}
              >
                {item.title2}
              </Text>
              <Text
                className="text-white/90 text-base leading-relaxed"
                style={{ fontFamily: 'HelveticaNeue' }}
              >
                {item.featureText}
              </Text>
            </View>
          ))}
        </ScrollView>
        {renderDots()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageScroll: {
    ...StyleSheet.absoluteFillObject,
  },
  imageBackground: {
    width,
    height,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  textContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 180, // leave room so dots stay visible above bottom buttons overlay
    paddingHorizontal: 24,
  },
  textScroll: {
    flex: 1,
  },
  textSlide: {
    paddingRight: 24,
  },
});

export default ImageCarousel;

