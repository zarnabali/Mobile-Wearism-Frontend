import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNav from './components/BottomNav';
import { Ionicons } from '@expo/vector-icons';

const chats = [
  { id: 'c1', name: 'Ava', preview: 'Meet at 7?', time: '2m', img: require('../assets/pictures/social.jpeg'), unread: true },
  { id: 'c2', name: 'Leo', preview: 'Loved that fit!', time: '12m', img: require('../assets/pictures/social3.jpeg'), unread: true },
  { id: 'c3', name: 'Mia', preview: 'Send the link', time: '1h', img: require('../assets/pictures/social4.jpeg'), unread: false },
  { id: 'c4', name: 'Zoe', preview: 'Let’s shoot tomorrow', time: '3h', img: require('../assets/pictures/wardrobe.jpeg'), unread: true },
  { id: 'c5', name: 'Marina', preview: 'Check this reel', time: '5h', img: require('../assets/pictures/shop.jpeg'), unread: false },
  { id: 'c6', name: 'Dustin', preview: 'AI fit looks fire', time: '8h', img: require('../assets/pictures/shop2.jpeg'), unread: false },
  { id: 'c7', name: 'Oliver', preview: 'Drop the link pls', time: '1d', img: require('../assets/pictures/social2.jpeg'), unread: false },
  { id: 'c8', name: 'Zara', preview: 'Paris drop incoming', time: '2d', img: require('../assets/pictures/ai2.jpeg'), unread: false },
  { id: 'c9', name: 'Jake', preview: 'Yo, did you see the new collection?', time: '3d', img: require('../assets/pictures/social.jpeg'), unread: false },
  { id: 'c10', name: 'Emma', preview: 'Can we reschedule?', time: '4d', img: require('../assets/pictures/social3.jpeg'), unread: false },
  { id: 'c11', name: 'Lucas', preview: 'Thanks for the help!', time: '5d', img: require('../assets/pictures/social4.jpeg'), unread: false },
  { id: 'c12', name: 'Sophia', preview: 'Where did you get that?', time: '1w', img: require('../assets/pictures/wardrobe.jpeg'), unread: false },
];

const MessagesScreen = () => {
  const router = useRouter();
  return (
    <View className="flex-1 bg-black">
      <LinearGradient colors={['rgba(60, 0, 8, 0.45)', 'rgba(60, 0, 8, 0.30)', 'rgba(60, 0, 8, 0.55)']} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
            <View className="px-5 pt-4 space-y-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-white text-3xl font-light" style={{ fontFamily: 'HelveticaNeue-Light' }}>
                  Messages
                </Text>
                <View className="flex-row space-x-3">
                  <TouchableOpacity className="bg-white/08 p-2 rounded-full border border-white/10">
                    <Ionicons name="camera-outline" size={18} color="#ffffff" />
                  </TouchableOpacity>
                  <TouchableOpacity className="bg-white/08 p-2 rounded-full border border-white/10">
                    <Ionicons name="create-outline" size={18} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="flex-row items-center bg-white/06 border border-white/10 rounded-2xl px-3 py-3 mb-2">
                <Ionicons name="search-outline" size={18} color="#ffffff" />
                <Text className="text-white/70 text-sm ml-2" style={{ fontFamily: 'HelveticaNeue' }}>
                  Search messages
                </Text>
              </View>

              <View className="flex-row space-x-3 mb-2 ">
                {['Primary', 'General', 'Requests'].map((tab, idx) => (
                  <TouchableOpacity
                    key={tab}
                    className={`px-4 py-2 rounded-full border ${idx === 0 ? 'bg-white/12 border-white/20' : 'bg-white/04 border-white/10'}`}
                  >
                    <Text
                      className="text-white text-sm"
                      style={{ fontFamily: idx === 0 ? 'HelveticaNeue-Medium' : 'HelveticaNeue' }}
                    >
                      {tab}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View className="bg-white/05 border border-white/10 rounded-3xl p-4 space-y-3">
                {chats.map((chat) => (
                  <TouchableOpacity
                    key={chat.id}
                    className="flex-row items-center justify-between py-3 border-b border-white/05"
                    onPress={() => router.push({ pathname: '/conversation', params: { name: chat.name, img: chat.img } })}
                  >
                    <View className="flex-row items-center">
                      <Image source={chat.img} style={{ width: 48, height: 48, borderRadius: 16 }} />
                      <View className="ml-3">
                        <Text
                          className="text-white text-base"
                          style={{ fontFamily: chat.unread ? 'HelveticaNeue-Bold' : 'HelveticaNeue-Medium' }}
                        >
                          {chat.name}
                        </Text>
                        <Text className="text-white/70 text-sm" style={{ fontFamily: 'HelveticaNeue' }}>
                          {chat.preview}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-white/50 text-xs mb-1" style={{ fontFamily: 'HelveticaNeue' }}>
                        {chat.time}
                      </Text>
                      {chat.unread ? <View className="w-2.5 h-2.5 rounded-full bg-orange-500" /> : null}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
        <BottomNav active="messages" />
      </LinearGradient>
    </View>
  );
};

export default MessagesScreen;

