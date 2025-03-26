import React, { createContext, useContext, useState } from 'react';
import { Product, CartItem, CheckoutData } from '../types/types';
import { createCheckout } from '../services/shopify';
import { useCustomer } from './CustomerContext';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  createShopifyCheckout: () => Promise<CheckoutData>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { accessToken } = useCustomer();

  const addToCart = (product: Product) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === product.id);
      if (existingItem) {
        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + (product.quantity || 1) }
            : item
        );
      }
      return [...currentCart, { 
        ...product, 
        quantity: product.quantity || 1,
      }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== productId)
    );
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity < 1) return;
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const createShopifyCheckout = async () => {
    try {
      if (cart.length === 0) {
        throw new Error('Cart is empty');
      }

      const lineItems = cart.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      }));

      const checkout = await createCheckout(lineItems, accessToken);
      
      if (!checkout.webUrl) {
        throw new Error('Invalid checkout URL received');
      }

      return {
        webUrl: checkout.webUrl,
        id: checkout.id,
      };
    } catch (error) {
      console.error('Checkout error:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Er is een fout opgetreden bij het afrekenen. Probeer het opnieuw.'
      );
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        createShopifyCheckout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};