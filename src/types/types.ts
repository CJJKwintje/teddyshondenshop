export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  variantId?: string; // Add Shopify variant ID
}

export interface CartItem extends Product {
  quantity: number;
}

export interface CheckoutData {
  webUrl: string;
  id: string;
}