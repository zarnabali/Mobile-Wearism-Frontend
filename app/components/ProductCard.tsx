import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    image: any;
    price: string;
    stock: number;
    sales: number;
    isActive: boolean;
    isTrending?: boolean;
  };
  onPress?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
        marginBottom: 14,
      }}
    >
      {/* Product Image */}
      <View style={{ position: 'relative', height: 180 }}>
        <Image
          source={product.image}
          style={{ width: '100%', height: '100%', opacity: 0.9 }}
          resizeMode="cover"
        />

        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%' }}
        />

        {/* Trending Badge */}
        {product.isTrending && (
          <View
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              backgroundColor: '#FF6B35',
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 5,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Ionicons name="flame" size={13} color="#fff" style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 10, fontFamily: 'HelveticaNeue', color: '#fff', letterSpacing: 0.5 }}>
              Trending
            </Text>
          </View>
        )}

        {/* Stock Status */}
        <View
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            backgroundColor: product.stock > 10 ? 'rgba(76,175,80,0.95)' : 'rgba(255,152,0,0.95)',
            borderRadius: 10,
            paddingHorizontal: 10,
            paddingVertical: 5,
          }}
        >
          <Text style={{ fontSize: 10, fontFamily: 'HelveticaNeue', color: '#fff' }}>
            {product.stock} in stock
          </Text>
        </View>

        {/* Active Status Indicator */}
        <View
          style={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.6)',
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 10,
          }}
        >
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: product.isActive ? '#4CAF50' : 'rgba(255,255,255,0.3)',
              marginRight: 6,
            }}
          />
          <Text style={{ fontSize: 10, fontFamily: 'HelveticaNeue-Light', color: '#fff' }}>
            {product.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {/* Product Info */}
      <View style={{ padding: 16 }}>
        <Text
          style={{
            fontSize: 17,
            fontFamily: 'HelveticaNeue',
            color: '#fff',
            marginBottom: 8,
          }}
          numberOfLines={1}
        >
          {product.name}
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 24, fontFamily: 'HelveticaNeue-Thin', color: '#FF6B35' }}>
              {product.price}
            </Text>
            <Text style={{ fontSize: 11, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {product.sales} sold
            </Text>
          </View>

          <TouchableOpacity
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.1)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ProductCard;
