import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

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
              backgroundColor: 'rgba(0,0,0,0.35)',
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
                <Ionicons name="person" size={32} color="rgba(255,255,255,0.55)" />
              </View>
            )}
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
