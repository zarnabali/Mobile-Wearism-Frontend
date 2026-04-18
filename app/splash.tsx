import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import ImageCarousel, { CarouselItem } from './components/ImageCarousel';
import { COLORS } from '../src/constants/theme';

// Carousel data with background images and text
const carouselData: CarouselItem[] = [
  {
    backgroundImage: require('../assets/pictures/ai2.jpeg'),
    title1: 'AI Knows Your Style,',
    title2: 'You New Personal Stylist',
    featureText: 'Get instant AI-powered outfit ratings. Upload your look and receive personalized feedback that helps you dress with confidence every single day.',
  },
  {
    backgroundImage: require('../assets/pictures/wardrobe2.jpeg'),
    title1: 'Your Digital Closet,',
    title2: 'Infinite Outfits.',
    featureText: 'Add items to your wardrobe and watch our AI create stunning outfit combinations tailored to your unique style. Never wonder "what should I wear?" again.',
  },
  {
    backgroundImage: require('../assets/pictures/social3.jpeg'),
    title1: 'Connect, Share,',
    title2: 'Inspire.',
    featureText: 'Join a vibrant fashion community. Post your looks, get inspired by others, and build connections with style enthusiasts who share your passion.',
  },
  {
    backgroundImage: require('../assets/pictures/ai.jpeg'),
    title1: 'Swap, Refresh,',
    title2: 'Reinvent.',
    featureText: 'Trade clothes with friends and discover new pieces without breaking the bank. Give your wardrobe a fresh look while reducing fashion waste.',
  },
  {
    backgroundImage: require('../assets/pictures/shop.jpeg'),
    title1: 'Sell Smart,',
    title2: 'Reach Right.',
    featureText: 'Register as a vendor and sell directly to users who actually need your items. Our AI matches your inventory with users wardrobe gaps for better sales.',
  },
  {
    backgroundImage: require('../assets/pictures/shop2.jpeg'),
    title1: 'Find Hidden Gems,',
    title2: 'Elevate Your Style.',
    featureText: 'Discover unique pieces that perfectly complement your wardrobe. Our smart recommendations help you find clothes that truly level up your fashion game.',
  },
];

const SplashScreen = () => {
  return (
    <View className="flex-1">
      <ImageCarousel items={carouselData} autoPlayInterval={4000} />

      {/* Allow touches on children while keeping overlay positioning */}
      <SafeAreaView className="absolute inset-0" pointerEvents="box-none">
        <View className="flex-1">
          {/* Header with App Logo - Top */}
          <View className="px-6 pt-8 pointer-events-auto">
            <Image
              source={require('../assets/logo/wearism-w.png')}
              style={{ width: 120, height: 40 }}
              resizeMode="contain"
            />
          </View>

          {/* Spacer to push content to bottom */}
          <View className="flex-1" />

          {/* Bottom Buttons */}
          <View className="px-6 pb-8 pointer-events-auto">
            {/* Added extra spacing between actions */}
            <View className="space-y-6">
              <Link href="/login" asChild>
                <TouchableOpacity
                  className="bg-primary py-4 rounded-full"
                  activeOpacity={0.8}
                >
                  <Text
                    className="text-white text-center text-lg font-h-medium"
                  >
                    Login
                  </Text>
                </TouchableOpacity>
              </Link>

              <Link href="/signup" asChild>
                <TouchableOpacity
                  className="py-4 border-2 border-primary rounded-full mt-2"
                  activeOpacity={0.8}
                >
                  <Text
                    className="text-primary text-center text-lg font-h-medium"
                  >
                    Create an Account
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default SplashScreen;
