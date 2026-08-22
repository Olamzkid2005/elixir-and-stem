import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, Headline } from '@/components/ui/Screen';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Icon } from '@/components/ui/Icon';
import { ProductImage } from '@/components/ProductImage';
import { api } from '@/api/client';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'WriteReview'>;

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Great',
  5: 'Excellent',
};

/** WriteReviewScreen — star picker (1–5) + optional text comment. */
export function WriteReviewScreen({ route, navigation }: Props) {
  const { orderItemId, productName, productImageColor, imageUrl } = route.params;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (rating === 0) {
      Alert.alert('Rating required', 'Please select a star rating.');
      return;
    }
    setLoading(true);
    try {
      await api.submitReview(orderItemId, rating, comment.trim() || undefined);
      Alert.alert('Review submitted', 'Thanks for your feedback!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Could not submit review', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <AppHeader back />
      <View className="flex-1 px-4">
        <Headline className="mt-2">Write a Review</Headline>

        {/* Product preview */}
        <View className="mt-4 overflow-hidden rounded-3xl bg-surface-container-lowest shadow-elevation-1" style={{ elevation: 1 }}>
          <View className="h-1 bg-primary/20" />
          <View className="flex-row items-center gap-3 p-4">
            <ProductImage
              imageUrl={imageUrl}
              color={productImageColor ?? '#d0e9d4'}
              className="h-14 w-14 rounded-2xl"
              iconSize={22}
            />
            <Text className="flex-1 font-headline text-base text-on-surface">{productName}</Text>
          </View>
        </View>

        {/* Star rating */}
        <View className="mb-2 mt-6 flex-row items-center gap-2">
          <View className="h-4 w-1 rounded-full bg-tertiary-fixed-dim" />
          <Text className="font-body-semibold text-xs uppercase tracking-widest text-on-surface-variant">
            Your Rating
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Pressable key={star} onPress={() => setRating(star)} hitSlop={8}>
              <Icon
                name={star <= rating ? 'star' : 'star_border'}
                size={44}
                color={star <= rating ? '#e9c176' : '#c3c8c1'}
              />
            </Pressable>
          ))}
          {rating > 0 && (
            <View className="ml-2 rounded-full bg-tertiary-fixed px-3 py-1">
              <Text className="font-body-semibold text-sm text-tertiary">
                {RATING_LABELS[rating]}
              </Text>
            </View>
          )}
        </View>

        {/* Comment */}
        <View className="mb-2 mt-6 flex-row items-center gap-2">
          <View className="h-4 w-1 rounded-full bg-secondary" />
          <Text className="font-body-semibold text-xs uppercase tracking-widest text-on-surface-variant">
            Your Review (optional)
          </Text>
        </View>
        <Input
          placeholder="What did you like or dislike? How did it make you feel?"
          multiline
          numberOfLines={5}
          value={comment}
          onChangeText={setComment}
          className="min-h-[120px]"
        />

        <View className="mt-6 mb-8 flex-row items-center gap-2 rounded-2xl bg-secondary-container p-3">
          <Icon name="verified" size={18} color="#4d644b" />
          <Text className="flex-1 font-body text-xs text-on-secondary-container">
            Reviews are verified-purchase only — only customers who received this item can review it.
          </Text>
        </View>

        <Button
          label="Submit Review"
          size="lg"
          className="w-full"
          loading={loading}
          onPress={submit}
        />
      </View>
    </Screen>
  );
}
