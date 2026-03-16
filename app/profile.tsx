import React, { useState } from 'react';
import { View, Text, ScrollView, ImageBackground, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from './components/BottomNav';
import Settings from './settings';
import { useVendor } from './contexts/VendorContext';

const profilePosts = [
  { id: 'p1', img: require('../assets/pictures/social2.jpeg') },
  { id: 'p2', img: require('../assets/pictures/wardrobe2.jpeg') },
  { id: 'p3', img: require('../assets/pictures/shop.jpeg') },
  { id: 'p4', img: require('../assets/pictures/social4.jpeg') },
  { id: 'p5', img: require('../assets/pictures/shop2.jpeg') },
  { id: 'p6', img: require('../assets/pictures/social.jpeg') },
];

const ProfileScreen = () => {
  const [settingsVisible, setSettingsVisible] = useState(false);

  let vendorData = { isVendor: false, brandName: '', brandType: null, categories: [], description: '', logo: null, banner: null, contactEmail: '', socialLinks: {} };
  try {
    const vendor = useVendor();
    vendorData = vendor.vendorData;
  } catch (error) {
    console.log('VendorContext error:', error);
  }

  const handleSettingsPress = () => {
    console.log('Settings button pressed!');
    setSettingsVisible(true);
  };

  return (
    <View className="flex-1 bg-black">
      <LinearGradient colors={['rgba(60, 0, 8, 0.45)', 'rgba(60, 0, 8, 0.30)', 'rgba(60, 0, 8, 0.55)']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false} bounces={false}>
          {/* Header Image */}
          <View className="h-[380px] w-full relative">
            <ImageBackground
              source={require('../assets/pictures/wardrobe2.jpeg')}
              style={{ width: '100%', height: '100%', justifyContent: 'flex-end' }}
              imageStyle={{ opacity: 0.95 }}
            >
              <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.9)']}
                style={{ height: '100%', width: '100%', position: 'absolute' }}
              />

              <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
                <View className="flex-row justify-between items-center px-5 py-2">
                  <TouchableOpacity className="bg-black/20 p-2 rounded-full backdrop-blur-md">
                    <Ionicons name="arrow-back" size={24} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSettingsPress} className="bg-black/20 p-2 rounded-full backdrop-blur-md">
                    <Ionicons name="settings-outline" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              </SafeAreaView>

              <View className="px-5 pb-6">
                <View className="flex-row items-end justify-between">
                  <View className="flex-row items-center">
                    <Image
                      source={require('../assets/pictures/social.jpeg')}
                      style={{ width: 80, height: 80, borderRadius: 24, borderWidth: 2, borderColor: '#FF6B35' }}
                    />
                    <View className="ml-4 mb-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-white text-3xl font-bold" style={{ fontFamily: 'HelveticaNeue-Bold' }}>
                          Leslie Fox
                        </Text>
                        {vendorData.isVendor && (
                          <View className="bg-[#FF6B35] px-2 py-1 rounded-lg">
                            <Text className="text-white text-xs font-bold" style={{ fontFamily: 'HelveticaNeue-Bold' }}>
                              VENDOR
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-white/70 text-base" style={{ fontFamily: 'HelveticaNeue' }}>
                        @leslie.wearism
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="flex-row mt-6 justify-between bg-white/10 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
                  <View className="items-center flex-1 border-r border-white/10">
                    <Text className="text-white text-xl font-bold" style={{ fontFamily: 'HelveticaNeue-Bold' }}>
                      12.3k
                    </Text>
                    <Text className="text-white/60 text-xs uppercase tracking-wider mt-1" style={{ fontFamily: 'HelveticaNeue-Medium' }}>
                      Followers
                    </Text>
                  </View>
                  <View className="items-center flex-1 border-r border-white/10">
                    <Text className="text-white text-xl font-bold" style={{ fontFamily: 'HelveticaNeue-Bold' }}>
                      842
                    </Text>
                    <Text className="text-white/60 text-xs uppercase tracking-wider mt-1" style={{ fontFamily: 'HelveticaNeue-Medium' }}>
                      Following
                    </Text>
                  </View>
                  <View className="items-center flex-1">
                    <Text className="text-white text-xl font-bold" style={{ fontFamily: 'HelveticaNeue-Bold' }}>
                      156
                    </Text>
                    <Text className="text-white/60 text-xs uppercase tracking-wider mt-1" style={{ fontFamily: 'HelveticaNeue-Medium' }}>
                      Posts
                    </Text>
                  </View>
                </View>

                <View className="flex-row mt-4 space-x-3">
                  <TouchableOpacity className="flex-1 bg-[#FF6B35] py-3.5 rounded-xl shadow-lg shadow-orange-500/20 items-center justify-center">
                    <Text className="text-white font-bold text-base" style={{ fontFamily: 'HelveticaNeue-Bold' }}>Follow</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="flex-1 bg-white/10 py-3.5 rounded-xl border border-white/10 items-center justify-center">
                    <Text className="text-white font-bold text-base" style={{ fontFamily: 'HelveticaNeue-Bold' }}>Message</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ImageBackground>
          </View>

          <View className="px-5 mt-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-xl font-medium" style={{ fontFamily: 'HelveticaNeue-Medium' }}>
                Recent posts
              </Text>
              <Ionicons name="grid-outline" size={20} color="rgba(255,255,255,0.5)" />
            </View>
            <View className="flex-row flex-wrap -mx-1">
              {profilePosts.map((post) => (
                <View key={post.id} className="w-1/3 px-1 mb-2">
                  <TouchableOpacity activeOpacity={0.8} className="rounded-2xl overflow-hidden">
                    <Image
                      source={post.img}
                      style={{ width: '100%', height: 130 }}
                      className="border border-white/10"
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
        <BottomNav active="profile" />
        <Settings visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
      </LinearGradient>
    </View>
  );
};

export default ProfileScreen;


