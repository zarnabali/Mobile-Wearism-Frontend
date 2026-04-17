import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const STORY_DISPLAY_MS = 10_000;

export interface StoryViewerItem {
  id: string;
  name: string;
  imageUri: string;
  avatarUri?: string | null;
  timeLabel: string;
}

interface StoryViewerProps {
  stories: StoryViewerItem[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
}

const StoryViewer: React.FC<StoryViewerProps> = ({
  stories,
  initialIndex,
  visible,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress] = useState(() => new Animated.Value(0));
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const indexRef = useRef(currentIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    indexRef.current = currentIndex;
  }, [currentIndex]);

  const goNextOrClose = useCallback(() => {
    const idx = indexRef.current;
    if (idx < stories.length - 1) {
      setCurrentIndex(idx + 1);
    } else {
      onClose();
    }
  }, [stories.length, onClose]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((idx) => (idx > 0 ? idx - 1 : idx));
  }, []);

  useEffect(() => {
    if (!visible || !stories.length) return undefined;

    progress.setValue(0);
    animRef.current?.stop();

    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: STORY_DISPLAY_MS,
      useNativeDriver: false,
    });
    animRef.current = anim;

    anim.start(({ finished }) => {
      if (finished) goNextOrClose();
    });

    return () => {
      anim.stop();
    };
  }, [visible, currentIndex, stories.length, progress, goNextOrClose]);

  const handleTapLeft = () => {
    animRef.current?.stop();
    handlePrevious();
  };

  const handleTapRight = () => {
    animRef.current?.stop();
    goNextOrClose();
  };

  if (!visible || !stories[currentIndex]) {
    return null;
  }

  const currentStory = stories[currentIndex];
  const headerAvatar = currentStory.avatarUri
    ? { uri: currentStory.avatarUri } as const
    : null;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <ImageBackground
          source={{ uri: currentStory.imageUri }}
          style={{ width, height }}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.6)']}
            style={{ flex: 1 }}
          >
            <View
              style={{
                flexDirection: 'row',
                paddingHorizontal: 8,
                paddingTop: 50,
                gap: 4,
              }}
            >
              {stories.map((_, index) => (
                <View
                  key={index}
                  style={{
                    flex: 1,
                    height: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    borderRadius: 1,
                    overflow: 'hidden',
                  }}
                >
                  {index === currentIndex ? (
                    <Animated.View
                      style={{
                        height: '100%',
                        backgroundColor: '#fff',
                        width: progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      }}
                    />
                  ) : index < currentIndex ? (
                    <View
                      style={{
                        height: '100%',
                        backgroundColor: '#fff',
                        width: '100%',
                      }}
                    />
                  ) : null}
                </View>
              ))}
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingTop: 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    borderWidth: 2,
                    borderColor: '#FF6B35',
                    padding: 2,
                    overflow: 'hidden',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                  }}
                >
                  {headerAvatar ? (
                    <Image source={headerAvatar} style={{ width: '100%', height: '100%', borderRadius: 14 }} />
                  ) : (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="person" size={18} color="rgba(255,255,255,0.7)" />
                    </View>
                  )}
                </View>
                <View style={{ marginLeft: 12 }}>
                  <Text
                    style={{
                      color: '#fff',
                      fontSize: 16,
                      fontWeight: 'bold',
                      fontFamily: 'HelveticaNeue-Bold',
                    }}
                  >
                    {currentStory.name}
                  </Text>
                  <Text
                    style={{
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: 12,
                      fontFamily: 'HelveticaNeue',
                    }}
                  >
                    {currentStory.timeLabel}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={onClose}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1, flexDirection: 'row' }}>
              <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleTapLeft} />
              <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleTapRight} />
            </View>
          </LinearGradient>
        </ImageBackground>
      </View>
    </Modal>
  );
};

export default StoryViewer;
