import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    ImageBackground,
    TouchableOpacity,
    Dimensions,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface Story {
    id: string;
    name: string;
    img: any;
}

interface StoryViewerProps {
    stories: Story[];
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
    const [progress] = useState(new Animated.Value(0));

    useEffect(() => {
        setCurrentIndex(initialIndex);
    }, [initialIndex]);

    useEffect(() => {
        if (visible) {
            // Reset progress
            progress.setValue(0);

            // Animate progress bar
            Animated.timing(progress, {
                toValue: 1,
                duration: 5000, // 5 seconds per story
                useNativeDriver: false,
            }).start(({ finished }) => {
                if (finished) {
                    handleNext();
                }
            });
        }

        return () => {
            progress.setValue(0);
        };
    }, [visible, currentIndex]);

    const handleNext = () => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            onClose();
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleTapLeft = () => {
        handlePrevious();
    };

    const handleTapRight = () => {
        handleNext();
    };

    if (!visible || !stories[currentIndex]) {
        return null;
    }

    const currentStory = stories[currentIndex];

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
                    source={currentStory.img}
                    style={{ width, height }}
                    resizeMode="cover"
                >
                    <LinearGradient
                        colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.6)']}
                        style={{ flex: 1 }}
                    >
                        {/* Progress Bars */}
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

                        {/* Header */}
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
                                    }}
                                >
                                    <ImageBackground
                                        source={currentStory.img}
                                        style={{ width: '100%', height: '100%' }}
                                        imageStyle={{ borderRadius: 14 }}
                                    />
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
                                        2h ago
                                    </Text>
                                </View>
                            </View>

                            {/* Close Button */}
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

                        {/* Tap Areas for Navigation */}
                        <View
                            style={{
                                flex: 1,
                                flexDirection: 'row',
                            }}
                        >
                            {/* Left half - Previous */}
                            <TouchableOpacity
                                style={{ flex: 1 }}
                                activeOpacity={1}
                                onPress={handleTapLeft}
                            />
                            {/* Right half - Next */}
                            <TouchableOpacity
                                style={{ flex: 1 }}
                                activeOpacity={1}
                                onPress={handleTapRight}
                            />
                        </View>

                        {/* Bottom Action Buttons */}
                        <View
                            style={{
                                paddingHorizontal: 16,
                                paddingBottom: 40,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 16,
                            }}
                        >
                            {/* Comment Input */}
                            <View
                                style={{
                                    flex: 1,
                                    height: 44,
                                    borderRadius: 22,
                                    borderWidth: 1,
                                    borderColor: 'rgba(255,255,255,0.3)',
                                    paddingHorizontal: 16,
                                    justifyContent: 'center',
                                }}
                            >
                                <Text
                                    style={{
                                        color: 'rgba(255,255,255,0.6)',
                                        fontFamily: 'HelveticaNeue',
                                    }}
                                >
                                    Send message
                                </Text>
                            </View>

                            {/* Like Button */}
                            <TouchableOpacity
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 22,
                                    backgroundColor: 'rgba(0,0,0,0.3)',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                <Ionicons name="heart-outline" size={24} color="#fff" />
                            </TouchableOpacity>

                            {/* Share Button */}
                            <TouchableOpacity
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 22,
                                    backgroundColor: 'rgba(0,0,0,0.3)',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                <Ionicons name="paper-plane-outline" size={22} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </ImageBackground>
            </View>
        </Modal>
    );
};

export default StoryViewer;
