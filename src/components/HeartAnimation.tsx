import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withDelay, 
  withSequence,
  runOnJS
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

interface HeartAnimationProps {
  onAnimationComplete: () => void;
}

export const HeartAnimation: React.FC<HeartAnimationProps> = ({ onAnimationComplete }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1, { damping: 10, stiffness: 100 }),
      withDelay(500, withSpring(0, { damping: 10, stiffness: 100 }, (finished) => {
        if (finished) {
          runOnJS(onAnimationComplete)();
        }
      }))
    );
    opacity.value = withSequence(
      withSpring(1),
      withDelay(500, withSpring(0))
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Ionicons name="heart" size={100} color={COLORS.primary} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -50,
    marginLeft: -50,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
});
