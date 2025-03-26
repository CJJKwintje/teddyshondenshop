export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  variantId: string;
  variantTitle?: string;
  quantity?: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface CheckoutData {
  webUrl: string;
  id: string;
}