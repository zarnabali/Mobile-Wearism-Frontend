import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/theme';

export interface StoryStripItem {
  id: string;
  name: string;
  /** Profile photo shown in the ring (cover). */
  coverUri?: string | null;
  onPress?: () => void;
  seen?: boolean;
}

interface StoriesStripProps {
  stories: StoryStripItem[];
  onAddStory?: () => void;
}

const StoriesStrip: React.FC<StoriesStripProps> = ({ stories, onAddStory }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
    <TouchableOpacity
      onPress={onAddStory}
      className="mr-4 items-center"
      activeOpacity={0.7}
    >
      <View
        style={{
          width: 68,
          height: 68,
          borderRadius: 34,
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.15)',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative'
        }}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <View style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: COLORS.primary, borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#000' }}>
           <Ionicons name="add" size={14} color="#fff" />
        </View>
      </View>
      <Text
        className="text-white/60 text-[11px] mt-2 font-h-light"
      >
        Your Story
      </Text>
    </TouchableOpacity>

    {stories.map((story) => (
      <TouchableOpacity
        key={story.id}
        onPress={story.onPress}
        className="mr-4 items-center"
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={story.seen ? ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)'] : ['#FF6B35', '#FF9F6A', '#FF3D00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 68,
            height: 68,
            borderRadius: 34,
            padding: 2.5,
          }}
        >
          <View
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 32,
              borderWidth: 2,
              borderColor: '#000',
              overflow: 'hidden',
              backgroundColor: '#111',
            }}
          >
            {story.coverUri ? (
              <Image
                source={{ uri: story.coverUri }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="person" size={28} color="rgba(255,255,255,0.3)" />
              </View>
            )}
          </View>
        </LinearGradient>
        <Text
          className="text-white/70 text-[11px] mt-2 font-h-light"
          numberOfLines={1}
        >
          {story.name}
        </Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
);

export default StoriesStrip;
