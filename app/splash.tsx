import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import BackgroundImage from './components/BackgroundImage';

const { width } = Dimensions.get('window');

const SplashScreen = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const contentData = {
    appName: 'Toolivo',
    slogan: 'Dynamic by Design, Scalable by Nature.',
    "features": [
    "A next-gen platform that connects backend and frontend into one smooth, flexible, and secure system.",
    "A platform that connects everything in one place.",
    "Stay in sync and connected, even offline.",
    "Gives safe and simple access for teams, customers, and businesses.",
    "Built to grow with you, offering flexibility and reliability as you expand."
  ]
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % contentData.features.length;
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({
            x: nextIndex * width,
            animated: true,
          });
        }
        return nextIndex;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const index = Math.round(contentOffset.x / width);
    setCurrentIndex(index);
  };

  const renderDots = () => {
    return (
      <View className="flex-row justify-left items-center mt-2 ">
        {contentData.features.map((_, index) => (
          <View
            key={index}
            className={`w-2 h-2 rounded-full mx-1 ${
              index === currentIndex ? 'bg-white' : 'bg-white/40'
            }`}
          />
        ))}
      </View>
    );
  };

  return (
    <BackgroundImage>
      <SafeAreaView className="flex-1">
        <View className="flex-1">
          {/* Header with App Name - Top */}
          <View className="px-6 pt-8">
            <Text className="text-white text-2xl font-bold">
              {contentData.appName}
            </Text>
          </View>

          {/* Spacer to push content to bottom */}
          <View className="flex-1" />

          {/* Main Content - Bottom */}
          <View className="px-6 pb-8">
            <Text className="text-white text-4xl font-bold leading-tight ">
              Dynamic by Design,
            </Text>
            <Text className="text-blue-400 text-4xl font-bold leading-tight mb-2">
              Scalable by Nature.
            </Text>

            {/* Feature Text Slider */}
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleScroll}
              className=""
            >
              {contentData.features.map((feature, index) => (
                <View key={index} style={{ width }}>
                  <Text className="text-white/80 text-base leading-relaxed px-0">
                    {feature}
                  </Text>
                </View>
              ))}
            </ScrollView>

            {/* Navigation Dots */}
            {renderDots()}

            {/* Bottom Buttons */}
            <View className="mt-8 space-y-4">
              <Link href="/login" asChild>
                <TouchableOpacity
                  className="bg-blue-800 py-4 rounded-full"
                  activeOpacity={0.8}
                >
                  <Text className="text-white text-center text-lg font-semibold">
                    Login
                  </Text>
                </TouchableOpacity>
              </Link>

              <Link href="/signup" asChild>
                <TouchableOpacity
                  className="py-4"
                  activeOpacity={0.8}
                >
                  <Text className="text-white shadow-2xl text-center text-lg">
                    Create an Account
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </BackgroundImage>
  );
};

export default SplashScreen;
