import React, { useState } from 'react';
import { View, Text, ScrollView, Image, ImageBackground, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import StoriesStrip from './components/StoriesStrip';
import StoryViewer from './components/StoryViewer';
import BottomNav from './components/BottomNav';
import VendorAdCard from './components/VendorAdCard';

const stories = [
  { id: 's1', name: 'Ava', img: require('../assets/pictures/social.jpeg') },
  { id: 's2', name: 'Mia', img: require('../assets/pictures/social2.jpeg') },
  { id: 's3', name: 'Leo', img: require('../assets/pictures/social3.jpeg') },
  { id: 's4', name: 'Kai', img: require('../assets/pictures/social4.jpeg') },
  { id: 's5', name: 'Zoe', img: require('../assets/pictures/wardrobe.jpeg') },
];

const feedCards = [
  {
    id: 'f1',
    name: 'Leslie Fox',
    location: 'Phoenix, USA',
    age: 23,
    img: require('../assets/pictures/wardrobe2.jpeg'),
    likes: 1234,
    caption: 'Living my best life in this amazing outfit! 🌟✨',
    comments: 89,
  },
  {
    id: 'f2',
    name: 'Dustin Ellenpark',
    location: 'Austin, USA',
    age: 28,
    img: require('../assets/pictures/shop.jpeg'),
    likes: 856,
    caption: 'New collection drop! Check it out 🔥',
    comments: 42,
  },
  {
    id: 'f3',
    name: 'Marina',
    location: 'LA, USA',
    age: 25,
    img: require('../assets/pictures/shop2.jpeg'),
    likes: 2341,
    caption: 'Fashion vibes on point today! 💫',
    comments: 156,
  },
  {
    id: 'f4',
    name: 'Oliver Bennet',
    location: 'NYC, USA',
    age: 27,
    img: require('../assets/pictures/social2.jpeg'),
    likes: 967,
    caption: 'Exploring the city streets 🌆',
    comments: 73,
  },
  {
    id: 'f5',
    name: 'Zara Hale',
    location: 'Paris, FR',
    age: 24,
    img: require('../assets/pictures/ai2.jpeg'),
    likes: 1889,
    caption: 'Paris never disappoints 🗼💕',
    comments: 124,
  },
  {
    id: 'f3',
    name: 'Marina',
    location: 'LA, USA',
    age: 25,
    img: require('../assets/pictures/shop2.jpeg'),
    likes: 2341,
    caption: 'Fashion vibes on point today! 💫',
    comments: 156,
  },
  {
    id: 'f3',
    name: 'Marina',
    location: 'LA, USA',
    age: 25,
    img: require('../assets/pictures/shop2.jpeg'),
    likes: 2341,
    caption: 'Fashion vibes on point today! 💫',
    comments: 156,
  }
];

const HomeScreen = () => {
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set());

  const handleStoryPress = (index: number) => {
    setSelectedStoryIndex(index);
    setStoryViewerVisible(true);
  };

  const handleAddStory = () => {
    console.log('Add story pressed');
    // Implement add story functionality
  };

  const toggleLike = (postId: string) => {
    setLikedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const toggleBookmark = (postId: string) => {
    setBookmarkedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  // Vendor ads - personalized based on user preferences (hardcoded for example demo)
  const vendorAds = [
    {
      id: 'ad1',
      brandName: 'UrbanStyle Co.',
      productName: 'Premium Denim Jacket',
      productImage: require('../assets/pictures/shop.jpeg'),
      price: '$129.99',
      isVerified: true,
    },
    {
      id: 'ad2',
      brandName: 'Sneaker Haven',
      productName: 'Classic White Sneakers',
      productImage: require('../assets/pictures/shop2.jpeg'),
      price: '$89.00',
      isVerified: true,
    },
  ];

  // Helper function to insert ads after every 7 posts
  const getFeedWithAds = () => {
    const feedWithAds: Array<{ type: 'post' | 'ad'; data: any; index: number }> = [];
    let adIndex = 0;

    feedCards.forEach((card, index) => {
      feedWithAds.push({ type: 'post', data: card, index });

      // Insert ad after every 7 posts
      if ((index + 1) % 7 === 0 && adIndex < vendorAds.length) {
        feedWithAds.push({ type: 'ad', data: vendorAds[adIndex], index: index + 0.5 });
        adIndex = (adIndex + 1) % vendorAds.length; // Cycle through ads
      }
    });

    return feedWithAds;
  };

  return (
    <View className="flex-1 bg-black">
      <LinearGradient
        colors={['rgba(60, 0, 8, 0.45)', 'rgba(60, 0, 8, 0.30)', 'rgba(60, 0, 8, 0.55)']}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1">
          <ScrollView
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View className="px-5 pt-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text
                  className="text-white text-3xl font-light"
                  style={{ fontFamily: 'HelveticaNeue-Light' }}
                >
                  Wearism
                </Text>
                <View className="flex-row space-x-4">
                  <TouchableOpacity>
                    <Ionicons name="heart-outline" size={26} color="#FF6B35" />
                  </TouchableOpacity>
                  <TouchableOpacity>
                    <Ionicons name="chatbubble-outline" size={24} color="#FF6B35" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Stories Strip */}
              <StoriesStrip
                stories={stories.map((s, index) => ({
                  ...s,
                  onPress: () => handleStoryPress(index),
                }))}
                onAddStory={handleAddStory}
              />
            </View>

            {/* Posts Feed with Vendor Ads */}
            <View className="mt-2">
              {getFeedWithAds().map((item) => {
                if (item.type === 'ad') {
                  // Render vendor ad with unique key
                  return (
                    <View key={`ad-${item.data.id}`} className="mb-6">
                      <VendorAdCard ad={item.data} />
                    </View>
                  );
                }

                // Render regular post with unique key
                const card = item.data;
                const isLiked = likedPosts.has(card.id);
                const isBookmarked = bookmarkedPosts.has(card.id);

                return (
                  <View key={`post-${card.id}`} className="mb-6">
                    {/* Post Header */}
                    <View className="px-5 flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center">
                        <LinearGradient
                          colors={['#FF6B35', '#3C0008']}
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 19,
                            padding: 2,
                          }}
                        >
                          <Image
                            source={card.img}
                            style={{
                              width: '100%',
                              height: '100%',
                              borderRadius: 17,
                            }}
                          />
                        </LinearGradient>
                        <View className="ml-3">
                          <Text
                            className="text-white text-base font-semibold"
                            style={{ fontFamily: 'HelveticaNeue-Bold' }}
                          >
                            {card.name}
                          </Text>
                          <Text
                            className="text-white/70 text-xs"
                            style={{ fontFamily: 'HelveticaNeue' }}
                          >
                            {card.location}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity>
                        <Ionicons name="ellipsis-horizontal" size={24} color="white" />
                      </TouchableOpacity>
                    </View>

                    {/* Post Image */}
                    <ImageBackground
                      source={card.img}
                      style={{ width: '100%', height: 420 }}
                      imageStyle={{ opacity: 0.96 }}
                    >
                      <LinearGradient
                        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)']}
                        style={{ flex: 1, justifyContent: 'flex-end', padding: 16 }}
                      />
                    </ImageBackground>

                    {/* Post Actions */}
                    <View className="px-5 pt-3">
                      <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row gap-5">
                          <TouchableOpacity
                            onPress={() => toggleLike(card.id)}
                            activeOpacity={0.7}
                          >
                            <Ionicons
                              name={isLiked ? 'heart' : 'heart-outline'}
                              size={28}
                              color={isLiked ? '#FF6B35' : '#fff'}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity activeOpacity={0.7}>
                            <Ionicons
                              name="chatbubble-outline"
                              size={26}
                              color="#fff"
                            />
                          </TouchableOpacity>
                          <TouchableOpacity activeOpacity={0.7}>
                            <Ionicons name="paper-plane-outline" size={26} color="#fff" />
                          </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                          onPress={() => toggleBookmark(card.id)}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                            size={26}
                            color={isBookmarked ? '#FF6B35' : '#fff'}
                          />
                        </TouchableOpacity>
                      </View>

                      {/* Likes Count */}
                      <Text
                        className="text-white font-semibold mb-2"
                        style={{ fontFamily: 'HelveticaNeue-Bold' }}
                      >
                        {(isLiked ? card.likes + 1 : card.likes).toLocaleString()} likes
                      </Text>

                      {/* Caption */}
                      <View className="mb-2">
                        <Text
                          className="text-white"
                          style={{ fontFamily: 'HelveticaNeue' }}
                        >
                          <Text
                            className="font-semibold"
                            style={{ fontFamily: 'HelveticaNeue-Bold' }}
                          >
                            {card.name}{' '}
                          </Text>
                          {card.caption}
                        </Text>
                      </View>

                      {/* View Comments */}
                      <TouchableOpacity className="mb-2">
                        <Text
                          className="text-white/60"
                          style={{ fontFamily: 'HelveticaNeue' }}
                        >
                          View all {card.comments} comments
                        </Text>
                      </TouchableOpacity>

                      {/* Time */}
                      <Text
                        className="text-white/50 text-xs"
                        style={{ fontFamily: 'HelveticaNeue' }}
                      >
                        2 hours ago
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </SafeAreaView>

        <BottomNav active="feed" />

        {/* Story Viewer */}
        <StoryViewer
          stories={stories}
          initialIndex={selectedStoryIndex}
          visible={storyViewerVisible}
          onClose={() => setStoryViewerVisible(false)}
        />
      </LinearGradient>
    </View>
  );
};

export default HomeScreen;


