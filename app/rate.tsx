import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNav from './components/BottomNav';


const ratingHistory = [
  { id: 'r1', title: 'Street black fit', score: '9.2', time: '2h ago', img: require('../assets/pictures/wardrobe2.jpeg') },
  { id: 'r2', title: 'Layered beige', score: '8.7', time: '1d ago', img: require('../assets/pictures/shop.jpeg') },
  { id: 'r3', title: 'Denim & knit', score: '8.4', time: '3d ago', img: require('../assets/pictures/social2.jpeg') },
];

const RateScreen = () => {
  return (
    <View className="flex-1 bg-black">
      <LinearGradient colors={['rgba(60, 0, 8, 0.45)', 'rgba(60, 0, 8, 0.30)', 'rgba(60, 0, 8, 0.55)']} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          <ScrollView contentContainerStyle={{ paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
            <View className="px-5 pt-4 space-y-8">
              <View className="flex-row items-center justify-between">
                <Text className="text-white text-3xl font-light tracking-wide" style={{ fontFamily: 'HelveticaNeue-Light' }}>
                  AI Outfit Ratings
                </Text>
                <TouchableOpacity className="bg-white/10 p-2.5 rounded-full border border-white/10">
                  <Ionicons name="stats-chart-outline" size={22} color="white" />
                </TouchableOpacity>
              </View>

              {/* Check your fit Section */}
              <View className="bg-white/05 border border-white/10 rounded-[32px] p-1 overflow-hidden my-2">
                <LinearGradient
                  colors={['rgba(255, 107, 53, 0.15)', 'rgba(0,0,0,0)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ padding: 24, borderRadius: 30 }}
                >
                  <View className="flex-row items-start justify-between mb-6">
                    <View>
                      <Text className="text-white text-2xl font-bold mb-2" style={{ fontFamily: 'HelveticaNeue-Bold' }}>
                        Check your fit
                      </Text>
                      <Text className="text-white/70 text-sm leading-5 max-w-[200px]" style={{ fontFamily: 'HelveticaNeue' }}>
                        Upload a photo and let AI rate your style instantly.
                      </Text>
                    </View>
                    <View className="w-14 h-14 bg-[#FF6B35]/20 rounded-2xl items-center justify-center border border-[#FF6B35]/30">
                      <Ionicons name="camera" size={28} color="#FF6B35" />
                    </View>
                  </View>

                  <TouchableOpacity
                    className="flex-row items-center justify-center bg-[#FF6B35] py-4 rounded-2xl shadow-lg shadow-orange-500/20"
                    activeOpacity={0.9}
                  >
                    <Ionicons name="scan-outline" size={20} color="white" style={{ marginRight: 8 }} />
                    <Text className="text-white font-bold text-light" style={{ fontFamily: 'HelveticaNeue-Light' }}>
                      Analyze Outfit
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>

              {/* Recent Analysis */}
              <View>
                <View className="flex-row items-center justify-between mb-2 px-1">
                  <Text className="text-white text-xl font-light" style={{ fontFamily: 'HelveticaNeue-Light' }}>
                    Recent Analysis
                  </Text>
                  <TouchableOpacity>
                    <Text className="text-white/50 text-sm" style={{ fontFamily: 'HelveticaNeue' }}>View all</Text>
                  </TouchableOpacity>
                </View>

                <View className="space-y-3">
                  {ratingHistory.map((r) => (
                    <TouchableOpacity
                      key={r.id}
                      className="flex-row items-center justify-between bg-white/05 border border-white/10 rounded-2xl p-3"
                      activeOpacity={0.7}
                    >
                      <View className="flex-row items-center space-x-4">
                        <Image
                          source={r.img}
                          style={{ width: 60, height: 60, borderRadius: 16 }}
                          className="mr-3"
                        />
                        <View>
                          <Text className="text-white text-base font-medium mb-1" style={{ fontFamily: 'HelveticaNeue-Medium' }}>
                            {r.title}
                          </Text>
                          <Text className="text-white/40 text-xs" style={{ fontFamily: 'HelveticaNeue' }}>
                            {r.time}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-center space-x-4 pr-2">
                        <View className="items-end">
                          <View className="flex-row items-center bg-[#FF6B35]/10 px-2 py-1 rounded-lg border border-[#FF6B35]/20">
                            <Text className="text-white text-base font-bold mr-1" style={{ fontFamily: 'HelveticaNeue-Bold' }}>
                              {r.score}
                            </Text>
                            <Ionicons name="star" size={12} color="#FF6B35" />
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
        <BottomNav active="rate" />
      </LinearGradient>
    </View>
  );
};

export default RateScreen;

