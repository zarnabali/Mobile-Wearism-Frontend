import React from 'react';
import { View, Text, ScrollView, ImageBackground, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNav from './components/BottomNav';

const wardrobeCategories = [
  { id: 'w1', title: 'Upper', img: require('../assets/pictures/ai.jpeg'), count: 18 },
  { id: 'w2', title: 'Lower', img: require('../assets/pictures/ai2.jpeg'), count: 12 },
  { id: 'w3', title: 'Footwear', img: require('../assets/pictures/wardrobe3.jpeg'), count: 9 },
  { id: 'w4', title: 'Accessories', img: require('../assets/pictures/social2.jpeg'), count: 22 },
];

const weeklyOutfits = [
  { day: 'Mon', fit: 'Smart Casual • AI picks', score: '9.1' },
  { day: 'Tue', fit: 'Street Layered', score: '8.6' },
  { day: 'Wed', fit: 'Minimal Studio', score: '8.9' },
  { day: 'Thu', fit: 'Neutral Core', score: '8.2' },
  { day: 'Fri', fit: 'Night Out', score: '9.3' },
  { day: 'Sat', fit: 'Weekend Chill', score: '8.5' },
  { day: 'Sun', fit: 'Athflow', score: '8.7' },
];

const WardrobeScreen = () => {
  return (
    <View className="flex-1 bg-black">
      <LinearGradient colors={['rgba(60, 0, 8, 0.45)', 'rgba(60, 0, 8, 0.30)', 'rgba(60, 0, 8, 0.55)']} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
            <View className="px-5 pt-4">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-3xl font-light" style={{ fontFamily: 'HelveticaNeue-Light' }}>
                  Wardrobe
                </Text>
                <TouchableOpacity className="bg-white/10 p-2.5 rounded-full border border-white/10">
                  <Ionicons name="search-outline" size={22} color="white" />
                </TouchableOpacity>
              </View>

              {/* Add Item Section */}
              <TouchableOpacity
                className="flex-row items-center justify-between bg-[#FF6B35] rounded-[24px] p-5 mb-8 shadow-lg shadow-orange-500/20"
                activeOpacity={0.9}
              >
                <View>
                  <Text className="text-white text-lg font-bold" style={{ fontFamily: 'HelveticaNeue-Bold' }}>
                    Add New Item
                  </Text>
                  <Text className="text-white/80 text-sm mt-1" style={{ fontFamily: 'HelveticaNeue' }}>
                    Upload or scan your clothes
                  </Text>
                </View>
                <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center">
                  <Ionicons name="add" size={24} color="white" />
                </View>
              </TouchableOpacity>

              {/* Categories */}
              <Text className="text-white text-xl mb-4 font-light" style={{ fontFamily: 'HelveticaNeue-light' }}>
                Categories
              </Text>
              <View className="flex-row flex-wrap -mx-2 mb-6">
                {wardrobeCategories.map((cat) => (
                  <View key={cat.id} className="w-1/2 px-2 mb-4">
                    <TouchableOpacity activeOpacity={0.9}>
                      <ImageBackground
                        source={cat.img}
                        style={{ height: 180, borderRadius: 24, overflow: 'hidden' }}
                        imageStyle={{ borderRadius: 24, opacity: 0.9 }}
                      >
                        <LinearGradient
                          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
                          style={{ flex: 1, justifyContent: 'flex-end', padding: 16 }}
                        >
                          <Text className="text-white text-xl font-bold" style={{ fontFamily: 'HelveticaNeue-Bold' }}>
                            {cat.title}
                          </Text>
                          <Text className="text-white/80 text-xs mt-1" style={{ fontFamily: 'HelveticaNeue' }}>
                            {cat.count} items
                          </Text>
                        </LinearGradient>
                      </ImageBackground>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Weekly AI Fits */}
              <View className="mb-4">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-white text-xl font-light" style={{ fontFamily: 'HelveticaNeue-light' }}>
                    Weekly AI Fits
                  </Text>
                  <TouchableOpacity>
                    <Text className="text-[#FF6B35] text-sm" style={{ fontFamily: 'HelveticaNeue-Medium' }}>
                      See all
                    </Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5">
                  {weeklyOutfits.map((o) => (
                    <TouchableOpacity
                      key={o.day}
                      className="mr-4 bg-white/05 border border-white/10 rounded-[24px] p-4 w-40"
                      activeOpacity={0.8}
                    >
                      <View className="flex-row items-center justify-between mb-3">
                        <Text
                          className="text-white/90 text-sm font-bold uppercase tracking-wider"
                          style={{ fontFamily: 'HelveticaNeue-Bold' }}
                        >
                          {o.day}
                        </Text>
                        <View className="bg-[#FF6B35]/20 px-2 py-1 rounded-lg">
                          <Text className="text-[#FF6B35] text-xs font-bold">{o.score}</Text>
                        </View>
                      </View>

                      <View className="h-24 bg-white/05 rounded-xl mb-3 items-center justify-center border border-white/05">
                        <Ionicons name="shirt-outline" size={32} color="rgba(255,255,255,0.3)" />
                      </View>

                      <Text className="text-white text-sm font-medium leading-5" style={{ fontFamily: 'HelveticaNeue-Medium' }}>
                        {o.fit}
                      </Text>
                      <Text className="text-white/50 text-xs mt-1" style={{ fontFamily: 'HelveticaNeue' }}>
                        Tap to view
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
        <BottomNav active="wardrobe" />
      </LinearGradient>
    </View>
  );
};

export default WardrobeScreen;


