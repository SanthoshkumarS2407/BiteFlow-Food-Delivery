
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'Veg' | 'Non-Veg' | 'Snacks' | 'Drinks';
}

export interface CartItem extends Food {
  quantity: number;
}

export interface OrderDetails {
  id?: number;
  user_id: number;
  customerName?: string;
  phone?: string;
  address: string;
  payment_method: 'COD' | 'UPI';
  total: number;
  status: 'Pending' | 'Preparing' | 'Delivered' | 'Cancelled';
  created_at: string;
  items?: { name: string, quantity: number, price: number }[];
}

export enum Page {
  HOME = 'home',
  MENU = 'menu',
  CART = 'cart',
  CHECKOUT = 'checkout',
  CONFIRMATION = 'confirmation',
  LOGIN = 'login',
  REGISTER = 'register',
  ADMIN = 'admin',
  HISTORY = 'history'
}
