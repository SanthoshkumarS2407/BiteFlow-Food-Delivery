// ─── Core Entities ────────────────────────────────────────────────────────────

export type UserRole = 'CUSTOMER' | 'RESTAURANT_OWNER' | 'DELIVERY_PARTNER' | 'ADMIN' | 'user' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status?: 'active' | 'suspended';
  avatar?: string;
  created_at?: string;
}

export type RestaurantStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface Restaurant {
  id: number;
  owner_id?: number;
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
  name: string;
  description?: string;
  image?: string;
  cover_image?: string;
  logo?: string;
  cuisine: string;
  rating: number;
  rating_count: number;
  delivery_time: string;
  min_order: number;
  price_for_two: number;
  distance: string;
  is_veg: number;
  is_open: number;
  status?: RestaurantStatus;
  offer?: string;
  offer_code?: string;
  address?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  opening_hours?: string;
  opening_time?: string;
  closing_time?: string;
  avg_delivery_time?: string;
  category?: string;
  is_active: number;
  foods?: Food[];
  reviews?: Review[];
  categories?: FoodCategory[];
}

export interface FoodCategory {
  id: number;
  restaurant_id: number;
  name: string;
  description?: string;
  is_active?: number;
  created_at?: string;
}


export interface Food {
  id: number;
  restaurant_id?: number;
  restaurant_name?: string;
  category_id?: number;
  name: string;
  description?: string;
  price: number;
  image?: string;
  category?: string;
  is_veg: number;
  is_available?: number;
  rating?: number;
  rating_count?: number;
  prep_time?: string;
  spicy_level?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  allergens?: string;
  tags?: string;
}

export interface Combo {
  id: number;
  restaurant_id: number;
  restaurant_name?: string;
  name: string;
  description?: string;
  image?: string;
  original_price: number;
  combo_price: number;
  discount_percent?: number;
  calories?: number;
  protein?: number;
  is_active?: number;
  created_at?: string;
}

export interface DeliveryPartner {
  id: number;
  user_id?: number;
  name: string;
  phone?: string;
  vehicle?: string;
  vehicle_number?: string;
  rating?: number;
  is_available: number;
  status?: string;
  total_deliveries?: number;
  today_earnings?: number;
  user_email?: string;
  created_at?: string;
}

export interface CartItem {
  id: number;            // cart row id
  food_id: number;
  name: string;
  description?: string;
  price: number;
  image?: string;
  category?: string;
  is_veg: number;
  calories?: number;
  quantity: number;
  unit_price?: number;
  customizations?: Record<string, string>;
  special_instructions?: string;
  restaurant_id?: number;
  restaurant_name?: string;
}

export interface Address {
  id?: number;
  user_id?: number;
  label: string;
  name?: string;
  phone?: string;
  flat?: string;
  street?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  instructions?: string;
  is_default?: number;
}

export interface Order {
  id: number;
  order_code?: string;
  user_id: number;
  restaurant_id?: number;
  restaurant_name?: string;
  customer_name?: string;
  phone?: string;
  total: number;
  subtotal?: number;
  delivery_fee?: number;
  platform_fee?: number;
  tax?: number;
  discount?: number;
  coupon_code?: string;
  payment_method: string;
  payment_status?: string;
  cancel_reason?: string;
  address?: string;
  address_id?: number;
  status: OrderStatus;
  delivery_partner?: string;
  delivery_partner_id?: number;
  delivery_partner_user_id?: number;
  delivery_partner_phone?: string;
  estimated_time?: string;
  created_at: string;
  updated_at?: string;
  items?: OrderItem[];
  status_history?: OrderStatusHistoryItem[];
  delivery_group_id?: number;
  is_rescue_order?: number;
  delivery_fee_saved?: number;
}

export interface OrderStatusHistoryItem {
  id: number;
  order_id: number;
  status: string;
  notes?: string;
  changed_by?: number;
  created_at: string;
}

export type OrderStatus =
  | 'PLACED'
  | 'Pending'
  | 'CONFIRMED'
  | 'Confirmed'
  | 'PREPARING'
  | 'Preparing'
  | 'READY_FOR_PICKUP'
  | 'Ready'
  | 'DELIVERY_ASSIGNED'
  | 'GOING_TO_RESTAURANT'
  | 'ARRIVED_AT_RESTAURANT'
  | 'FOOD_PICKED_UP'
  | 'Picked Up'
  | 'OUT_FOR_DELIVERY'
  | 'Out for Delivery'
  | 'ARRIVED_AT_CUSTOMER'
  | 'DELIVERED'
  | 'Delivered'
  | 'CANCELLED_BY_RESTAURANT'
  | 'CANCELLED'
  | 'Cancelled';

export interface OrderItem {
  id: number;
  order_id: number;
  food_id?: number;
  food_name: string;
  quantity: number;
  price: number;
  customizations?: string;
  image?: string;
  is_rescue?: number;
  rescue_item_id?: number;
}

export interface Coupon {
  id: number;
  code: string;
  description: string;
  discount_type: 'percent' | 'flat' | 'delivery';
  discount_value: number;
  min_order: number;
  max_discount?: number;
  valid_until?: string;
  usage_limit?: number;
}

export interface Review {
  id: number;
  user_id: number;
  user_name?: string;
  order_id?: number;
  restaurant_id: number;
  restaurant_rating?: number;
  food_rating?: number;
  delivery_rating?: number;
  comment?: string;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message?: string;
  type: string;
  is_read: number;
  created_at: string;
}

// ─── Smart Surplus Rescue Entities ──────────────────────────────────────────
export interface SurplusRescueItem {
  id: number;
  restaurant_id: number;
  restaurant_name?: string;
  restaurant_cuisine?: string;
  restaurant_image?: string;
  restaurant_rating?: number;
  restaurant_distance?: string;
  restaurant_delivery_time?: string;
  restaurant_address?: string;
  food_id: number;
  food_name?: string;
  food_description?: string;
  food_image?: string;
  food_category?: string;
  food_is_veg?: number;
  food_calories?: number;
  prepared_quantity: number;
  remaining_quantity: number;
  predicted_surplus: number;
  original_price: number;
  rescue_price: number;
  discount_percent?: number;
  start_time: string;
  expiry_time: string;
  status: 'active' | 'sold_out' | 'expired' | 'cancelled';
  created_at: string;
}

export interface RescuePredictionItem {
  food_id: number;
  food_name: string;
  category: string;
  price: number;
  image?: string;
  is_veg: number;
  prepared_quantity: number;
  sold_quantity: number;
  remaining_quantity: number;
  historical_demand: number;
  current_time: string;
  estimated_surplus: number;
  suggested_rescue_quantity: number;
  suggested_rescue_price: number;
  rescue_window: string;
  model_version?: string;
  model_formula?: string;
  confidence_score?: number;
  active_listing?: {
    id: number;
    remaining: number;
    status: string;
  } | null;
}

// ─── Neighbourhood Group Delivery Entities ────────────────────────────────────
export type DeliveryGroupStatus =
  | 'Group Created'
  | 'Orders Confirmed'
  | 'Restaurant Preparing'
  | 'Orders Ready'
  | 'Delivery Partner Assigned'
  | 'Picked Up'
  | 'Route Started'
  | 'Delivering'
  | 'Completed';

export interface GroupOrderStop {
  id: number;
  order_id: number;
  sequence_number: number;
  status: string;
  is_current_user?: boolean;
  label: string;
  customer_display: string;
  area: string;
  distance_note?: string;
  is_completed?: boolean;
}

export interface DeliveryGroup {
  id: number;
  restaurant_id: number;
  restaurant_name?: string;
  restaurant_image?: string;
  restaurant_address?: string;
  status: DeliveryGroupStatus;
  created_at: string;
  group_window_start: string;
  group_window_end: string;
  delivery_partner_id?: number;
  partner_name?: string;
  partner_phone?: string;
  partner_vehicle?: string;
  partner_rating?: number;
  estimated_distance: number;
  estimated_time: string;
  target_area?: string;
  order_count: number;
  savings_per_customer: number;
  stops?: GroupOrderStop[];
  privacy_notice?: string;
}

export interface AvailableGroupResponse {
  available: boolean;
  can_initiate?: boolean;
  group_id?: number;
  restaurant_id?: number;
  restaurant_name?: string;
  current_orders?: number;
  max_orders?: number;
  estimated_delivery?: string;
  delivery_fee?: number;
  original_delivery_fee?: number;
  you_save?: number;
  target_area?: string;
  message: string;
}

// ─── Environmental Impact ───────────────────────────────────────────────────
export interface DeliveryImpact {
  user_id?: number;
  rescue_meals_supported: number;
  group_deliveries_joined: number;
  delivery_trips_combined: number;
  estimated_meals_diverted: number;
  estimated_co2_saved_kg: number;
  total_savings_inr: number;
  methodology_note?: string;
}

export interface RescueAdminAnalytics {
  listings_created: number;
  rescue_meals_sold: number;
  rescue_meals_expired: number;
  estimated_food_saved_kg: number;
  restaurant_participation: number;
  conversion_rate: number;
}

export interface GroupDeliveryAdminAnalytics {
  groups_created: number;
  orders_grouped: number;
  average_group_size: number;
  delivery_trips_combined: number;
  average_customer_saving: number;
}

// ─── App Navigation ───────────────────────────────────────────────────────────
export type AppPage =
  | 'home'
  | 'restaurants'
  | 'restaurant-detail'
  | 'search'
  | 'cart'
  | 'checkout'
  | 'order-tracking'
  | 'order-history'
  | 'order-detail'
  | 'favorites'
  | 'profile'
  | 'offers'
  | 'login'
  | 'register'
  | 'admin'
  | 'owner-dashboard'
  | 'delivery-dashboard'
  | 'group-tracking'
  | 'rescue'
  | 'impact';

// ─── Bill Summary ─────────────────────────────────────────────────────────────
export interface BillSummary {
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  tax: number;
  discount: number;
  total: number;
}
