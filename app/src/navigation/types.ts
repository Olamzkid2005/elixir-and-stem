import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Product } from '@/api/types';

export type CustomerTabParamList = {
  Home: undefined;
  Browse: undefined;
  Cart: undefined;
  Orders: undefined;
  Profile: undefined;
};

export type MerchantTabParamList = {
  Dashboard: undefined;
  Inventory: undefined;
  OrderQueue: undefined;
  Analytics: undefined;
  MerchantProfile: undefined;
};

export type RootStackParamList = {
  AgeGate: undefined;
  RoleSelect: undefined;
  SignIn: undefined;
  MerchantOnboarding: undefined;
  CustomerTabs: NavigatorScreenParams<CustomerTabParamList>;
  MerchantTabs: NavigatorScreenParams<MerchantTabParamList>;
  ProductDetail: { product: Product };
  Checkout: undefined;
  OrderTracking: { orderId?: string };
  ProductForm: { productId?: string };
};
