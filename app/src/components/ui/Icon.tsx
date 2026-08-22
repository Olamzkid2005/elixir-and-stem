import React from 'react';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Maps the Material Symbols names used in the design reference to
 * @expo/vector-icons equivalents so screens can use design icon names directly.
 */
const materialMap = {
  menu: 'menu',
  notifications: 'notifications-none',
  search: 'search',
  home: 'home',
  shopping_bag: 'shopping-bag',
  person: 'person-outline',
  star: 'star',
  star_border: 'star-border',
  add: 'add',
  remove: 'remove',
  add_circle: 'add-circle-outline',
  close: 'close',
  arrow_back: 'arrow-back',
  arrow_forward: 'arrow-forward',
  mail: 'mail-outline',
  lock: 'lock-outline',
  visibility_off: 'visibility-off',
  check: 'check',
  check_circle: 'check-circle',
  schedule: 'schedule',
  calendar_today: 'calendar-today',
  local_shipping: 'local-shipping',
  local_florist: 'local-florist',
  call: 'call',
  chat: 'chat-outline',
  support_agent: 'support-agent',
  receipt_long: 'receipt-long',
  stars: 'stars',
  verified: 'verified',
  location_on: 'location-on',
  map: 'map',
  list: 'format-list-bulleted',
  tune: 'tune',
  inventory: 'inventory-2-outline',
  dashboard: 'space-dashboard',
  storefront: 'storefront',
  upload_file: 'upload-file',
  logout: 'logout',
  chevron_right: 'chevron-right',
  spa: 'spa',
  mood: 'mood',
  bedtime: 'bedtime',
  edit: 'edit',
  delete: 'delete-outline',
  pending: 'pending-actions',
  // Tier 1 feature icons
  favorite: 'favorite',
  favorite_border: 'favorite-border',
  replay: 'replay',
  rate_review: 'rate-review',
  expand_less: 'expand-less',
  expand_more: 'expand-more',
  card_giftcard: 'card-giftcard',
  workspace_premium: 'workspace-premium',
  emoji_events: 'emoji-events',
  radio_button_unchecked: 'radio-button-unchecked',
  today: 'today',
  savings: 'savings',
  admin_panel_settings: 'admin-panel-settings',
  description: 'description',
  // UI improvement icons
  search_off: 'search-off',
  history: 'history',
  error: 'error',
} as const;

const communityMap = {
  // icons that live in MaterialCommunityIcons
} as const;

export type IconName = keyof typeof materialMap | keyof typeof communityMap;

export function Icon({
  name,
  size = 24,
  color = '#1b1c19',
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  if (name in communityMap) {
    return (
      <MaterialCommunityIcons
        name={communityMap[name as keyof typeof communityMap] as any}
        size={size}
        color={color}
      />
    );
  }
  return (
    <MaterialIcons
      name={materialMap[name as keyof typeof materialMap] as any}
      size={size}
      color={color}
    />
  );
}
