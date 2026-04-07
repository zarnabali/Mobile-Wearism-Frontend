import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';

type TabKey = 'feed' | 'wardrobe' | 'rate' | 'shop' | 'search' | 'messages' | 'profile';

const tabs: { key: TabKey; icon: string; label: string; href: string }[] = [
  { key: 'feed', icon: 'home', label: 'Feed', href: '/feed' },
  { key: 'wardrobe', icon: 'grid', label: 'Closet', href: '/wardrobe' },
  { key: 'rate', icon: 'camera', label: 'Rate', href: '/rate' },
  { key: 'shop', icon: 'bag-handle', label: 'Shop', href: '/shop/catalog' },
  { key: 'search', icon: 'search', label: 'Search', href: '/search' },

  { key: 'messages', icon: 'chatbubbles', label: 'Chat', href: '/messages' },

  { key: 'profile', icon: 'person', label: 'Profile', href: '/profile' },
];

interface BottomNavProps {
  active: TabKey;
}

const BottomNav: React.FC<BottomNavProps> = ({ active }) => {
  return (
    <View className="absolute bottom-5 left-0 right-0 px-6">
      <LinearGradient
        colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          paddingVertical: 10,
          paddingHorizontal: 4,
          borderRadius: 24,
          borderWidth: 0.5,
          borderColor: 'rgba(255,255,255,0.2)',
          backgroundColor: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(20px)',
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 15,
          shadowOffset: { width: 0, height: 5 },
          elevation: 8,
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          return (
            <Link key={tab.key} href={tab.href} asChild>
              <TouchableOpacity
                className="items-center justify-center"
                activeOpacity={0.6}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 8,
                }}
              >
                <Ionicons
                  name={`${tab.icon}${isActive ? '' : '-outline'}` as any}
                  size={20}
                  color={isActive ? '#FF6B35' : 'rgba(255,255,255,0.65)'}
                  style={{
                    marginBottom: 2,
                  }}
                />
                <Text
                  className="text-[9px]"
                  style={{
                    fontFamily: 'HelveticaNeue',
                    color: isActive ? '#FF6B35' : 'rgba(255,255,255,0.65)',
                    letterSpacing: 0.3,
                  }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            </Link>
          );
        })}
      </LinearGradient>
    </View>
  );
};

export default BottomNav;

