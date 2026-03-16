import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface StoryItem {
  id: string;
  name: string;
  img: any;
  onPress?: () => void;
  seen?: boolean;
}

interface StoriesStripProps {
  stories: StoryItem[];
  onAddStory?: () => void;
}

const StoriesStrip: React.FC<StoriesStripProps> = ({ stories, onAddStory }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
    {/* Your Story */}
    <TouchableOpacity
      onPress={onAddStory}
      className="mr-3 items-center"
      activeOpacity={0.7}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 18,
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderWidth: 2,
          borderColor: 'rgba(255,255,255,0.2)',
          borderStyle: 'dashed',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Ionicons name="add-circle" size={28} color="#FF6B35" />
      </View>
      <Text
        className="text-white/90 text-xs mt-2 font-semibold"
        style={{ fontFamily: 'HelveticaNeue-Bold' }}
      >
        Your Story
      </Text>
    </TouchableOpacity>

    {/* User Stories */}
    {stories.map((story) => (
      <TouchableOpacity
        key={story.id}
        onPress={story.onPress}
        className="mr-3 items-center"
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={story.seen ? ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.2)'] : ['#FF6B35', '#FF8C61', '#3C0008']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            padding: 3,
          }}
        >
          <View
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 15,
              borderWidth: 3,
              borderColor: '#000',
              overflow: 'hidden',
            }}
          >
            <Image
              source={story.img}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>
        </LinearGradient>
        <Text
          className="text-white/80 text-xs mt-2"
          style={{ fontFamily: 'HelveticaNeue' }}
          numberOfLines={1}
        >
          {story.name}
        </Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
);

export default StoriesStrip;



