import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNav from './components/BottomNav';

// Dummy data for the masonry grid
const exploreContent = [
  { id: '1', img: require('../assets/pictures/social.jpeg'), height: 220 },
  { id: '2', img: require('../assets/pictures/wardrobe2.jpeg'), height: 300 },
  { id: '3', img: require('../assets/pictures/shop.jpeg'), height: 180 },
  { id: '4', img: require('../assets/pictures/ai.jpeg'), height: 260 },
  { id: '5', img: require('../assets/pictures/social2.jpeg'), height: 240 },
  { id: '6', img: require('../assets/pictures/social3.jpeg'), height: 200 },
  { id: '7', img: require('../assets/pictures/wardrobe.jpeg'), height: 280 },
  { id: '8', img: require('../assets/pictures/shop2.jpeg'), height: 210 },
  { id: '9', img: require('../assets/pictures/ai2.jpeg'), height: 250 },
  { id: '10', img: require('../assets/pictures/social4.jpeg'), height: 190 },
  { id: '11', img: require('../assets/pictures/wardrobe3.jpeg'), height: 270 },
  { id: '12', img: require('../assets/pictures/Outfit Inspiration Men.jpeg'), height: 230 },
];

const categories = ['IGTV', 'Shop', 'Style', 'Auto', 'Gaming', 'Food', 'Travel'];

const SearchScreen = () => {
  // Split content into two columns
  const leftColumn = exploreContent.filter((_, i) => i % 2 === 0);
  const rightColumn = exploreContent.filter((_, i) => i % 2 !== 0);

  return (
    <View className="flex-1 bg-black">
      <LinearGradient colors={['rgba(60, 0, 8, 0.45)', 'rgba(60, 0, 8, 0.30)', 'rgba(60, 0, 8, 0.55)']} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          {/* Search Header */}
          <View className="px-4 pt-2 pb-4">
            <View className="flex-row items-center bg-white/10 rounded-xl px-4 py-2.5 mb-4 border border-white/10">
              <Ionicons name="search" size={20} color="rgba(255,255,255,0.6)" />
              <TextInput
                placeholder="Search"
                placeholderTextColor="rgba(255,255,255,0.6)"
                className="flex-1 ml-3 text-white text-[16px]"
                style={{ paddingVertical: 0,  fontFamily: 'HelveticaNeue' }}
              />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              {categories.map((cat, index) => (
                <TouchableOpacity
                  key={cat}
                  className={`px-5 py-2 rounded-lg border border-white/10 mr-2 ${index === 0 ? 'bg-white text-black' : 'bg-transparent'}`}
                  style={{ backgroundColor: index === 0 ? 'white' : 'rgba(255,255,255,0.05)' }}
                >
                  <Text
                    className={`text-sm font-medium ${index === 0 ? 'text-black' : 'text-white'}`}
                    style={{ fontFamily: 'HelveticaNeue-Medium' }}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            <View className="flex-row px-2">
              {/* Left Column */}
              <View className="flex-1 mr-1">
                {leftColumn.map((item) => (
                  <TouchableOpacity key={item.id} activeOpacity={0.9} className="mb-2">
                    <Image
                      source={item.img}
                      style={{ width: '100%', height: item.height, borderRadius: 12 }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Right Column */}
              <View className="flex-1 ml-1">
                {rightColumn.map((item) => (
                  <TouchableOpacity key={item.id} activeOpacity={0.9} className="mb-2">
                    <Image
                      source={item.img}
                      style={{ width: '100%', height: item.height, borderRadius: 12 }}
                      resizeMode="cover"
                    />
                    {/* Overlay Icon Example (Video/Multiple) */}
                    {parseInt(item.id) % 3 === 0 && (
                      <View className="absolute top-3 right-3">
                        <Ionicons name="copy-outline" size={20} color="white" />
                      </View>
                    )}
                    {parseInt(item.id) % 5 === 0 && (
                      <View className="absolute top-3 right-3">
                        <Ionicons name="play-outline" size={24} color="white" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
        <BottomNav active="search" />
      </LinearGradient>
    </View>
  );
};

export default SearchScreen;
