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
        <View className="mt-4 flex-row items-center gap-3 rounded-2xl bg-surface-container-lowest p-4">
          <ProductImage
            imageUrl={imageUrl}
            color={productImageColor ?? '#d0e9d4'}
            className="h-14 w-14 rounded-xl"
            iconSize={22}
          />
          <Text className="flex-1 font-headline text-base text-on-surface">{productName}</Text>
        </View>

        {/* Star rating */}
        <Text className="mb-3 mt-6 font-body-semibold text-xs uppercase tracking-widest text-on-surface-variant">
          Your Rating
        </Text>
        <View className="flex-row items-center gap-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <Pressable key={star} onPress={() => setRating(star)} hitSlop={8}>
              <Icon
                name={star <= rating ? 'star' : 'star_border'}
                size={40}
                color={star <= rating ? '#e9c176' : '#c3c8c1'}
              />
            </Pressable>
          ))}
          {rating > 0 && (
            <Text className="ml-2 font-body text-sm text-on-surface-variant">
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Great'}
              {rating === 5 && 'Excellent'}
            </Text>
          )}
        </View>

        {/* Comment */}
        <Text className="mb-3 mt-6 font-body-semibold text-xs uppercase tracking-widest text-on-surface-variant">
          Your Review (optional)
        </Text>
        <Input
          placeholder="What did you like or dislike? How did it make you feel?"
          multiline
          numberOfLines={5}
          value={comment}
          onChangeText={setComment}
          className="min-h-[120px]"
        />

        <View className="mt-6 mb-8 flex-row items-center gap-2 rounded-xl bg-secondary-container p-3">
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
