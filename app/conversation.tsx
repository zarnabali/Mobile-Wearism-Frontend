import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const ConversationScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const name = typeof params.name === 'string' ? params.name : params.name?.[0];
  const img = typeof params.img === 'string' ? params.img : params.img?.[0];
  const [message, setMessage] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  // Hardcoded conversation messages
  const [messages, setMessages] = useState([
    { id: '1', text: 'Yo, did you see the new drop?', sender: 'them', time: '10:30 AM' },
    { id: '2', text: 'Yeah, it looks sick! 🔥', sender: 'me', time: '10:32 AM' },
    { id: '3', text: 'I might cop the black hoodie.', sender: 'them', time: '10:33 AM' },
    { id: '4', text: 'Same here. The fit looks perfect.', sender: 'me', time: '10:35 AM' },
    { id: '5', text: 'Are you going to the event tonight?', sender: 'them', time: '10:40 AM' },
    { id: '6', text: 'For sure. See you there!', sender: 'me', time: '10:42 AM' },
    { id: '7', text: 'Bet.', sender: 'them', time: '10:45 AM' },
  ]);

  const sendMessage = () => {
    if (message.trim().length > 0) {
      setMessages([...messages, { id: Date.now().toString(), text: message, sender: 'me', time: 'Now' }]);
      setMessage('');
    }
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <View className="flex-1 bg-black">
      <LinearGradient colors={['rgba(60, 0, 8, 0.45)', 'rgba(60, 0, 8, 0.30)', 'rgba(60, 0, 8, 0.55)']} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1" edges={['top']}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-white/10 bg-white/05">
            <View className="flex-row items-center">
              <TouchableOpacity onPress={() => router.back()} className="mr-4">
                <Ionicons name="arrow-back" size={28} color="white" />
              </TouchableOpacity>
              <View className="flex-row items-center">
                {img ? (
                  <Image source={{ uri: img }} className="w-9 h-9 rounded-full border border-white/10" />
                ) : (
                  <View className="w-9 h-9 rounded-full bg-white/10 items-center justify-center border border-white/10">
                    <Text className="text-white text-sm font-medium">{name ? name[0] : '?'}</Text>
                  </View>
                )}
                <View className="ml-3">
                  <Text className="text-white font-bold text-base" style={{ fontFamily: 'HelveticaNeue-Bold' }}>
                    {name || 'User'}
                  </Text>
                  <Text className="text-white/50 text-xs" style={{ fontFamily: 'HelveticaNeue' }}>
                    Active now
                  </Text>
                </View>
              </View>
            </View>
            <View className="flex-row items-center space-x-7">
              <TouchableOpacity>
                <Ionicons name="call-outline" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity>
                <Ionicons name="videocam-outline" size={26} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1"
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
            <ScrollView
              ref={scrollViewRef}
              className="flex-1 px-4 pt-4"
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Timestamp */}
              <View className="items-center mb-6 mt-2">
                <Text className="text-white/40 text-xs font-medium" style={{ fontFamily: 'HelveticaNeue-Medium' }}>Today 10:30 AM</Text>
              </View>

              {messages.map((msg) => (
                <View
                  key={msg.id}
                  className={`mb-3 max-w-[75%] ${msg.sender === 'me' ? 'self-end' : 'self-start'}`}
                >
                  {msg.sender === 'them' && (
                    <View className="flex-row items-end">
                      <View
                        className="rounded-2xl px-4 py-3 bg-white/10 border border-white/05"
                        style={{
                          borderBottomRightRadius: 16,
                          borderBottomLeftRadius: 4,
                        }}
                      >
                        <Text className="text-white text-[15px] leading-5" style={{ fontFamily: 'HelveticaNeue' }}>
                          {msg.text}
                        </Text>
                      </View>
                    </View>
                  )}
                  {msg.sender === 'me' && (
                    <View
                      className="rounded-2xl px-4 py-3"
                      style={{
                        backgroundColor: '#FF6B35',
                        borderBottomRightRadius: 4,
                        borderBottomLeftRadius: 16,
                        borderTopRightRadius: 16,
                        borderTopLeftRadius: 16,
                      }}
                    >
                      <Text className="text-white text-[15px] leading-5" style={{ fontFamily: 'HelveticaNeue' }}>
                        {msg.text}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>

            {/* Input Area */}
            <View className="px-4 py-3 border-t border-white/10 pb-8 bg-black/20">
              <View className="flex-row items-center bg-white/10 rounded-full px-4 py-2 min-h-[44px] border border-white/10">
                <TouchableOpacity className="mr-3 bg-[#FF6B35] p-1.5 rounded-full">
                  <Ionicons name="camera" size={18} color="white" />
                </TouchableOpacity>
                <TextInput
                  className="flex-1 text-white text-[15px] max-h-24"
                  placeholder="Message..."
                  placeholderTextColor="#rgba(255,255,255,0.5)"
                  multiline
                  value={message}
                  onChangeText={setMessage}
                  style={{ paddingVertical: 0,  fontFamily: 'HelveticaNeue' }}
                />
                {message.length > 0 ? (
                  <TouchableOpacity onPress={sendMessage}>
                    <Text className="text-[#FF6B35] font-bold ml-3 text-base">Send</Text>
                  </TouchableOpacity>
                ) : (
                  <View className="flex-row items-center space-x-6 ml-2">
                    <TouchableOpacity>
                      <Ionicons name="mic-outline" size={24} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity>
                      <Ionicons name="image-outline" size={24} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity>
                      <Ionicons name="add-circle-outline" size={24} color="white" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

export default ConversationScreen;
