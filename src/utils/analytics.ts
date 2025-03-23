// Type definitions for analytics events
declare global {
  interface Window {
    dataLayer: any[];
  }
}

// Initialize dataLayer if it doesn't exist
if (typeof window !== 'undefined') {
  window.dataLayer = window.dataLayer || [];
}

interface Product {
  id: string;
  title: string;
  price: number;
  brand?: string;
  category?: string;
  variant?: string;
  quantity?: number;
}

interface PageViewProps {
  pageType: 'category' | 'subcategory' | 'product' | 'cart' | 'checkout';
  category?: string;
  subcategory?: string;
  title: string;
}

export const trackPageView = ({ pageType, category, subcategory, title }: PageViewProps) => {
  window.dataLayer?.push({
    event: 'page_view',
    page_type: pageType,
    category,
    subcategory,
    page_title: title
  });
};

export const trackFilterUse = (filterType: 'price' | 'brand', value: string, pageContext: { category?: string; subcategory?: string }) => {
  window.dataLayer?.push({
    event: 'filter_use',
    filter_type: filterType,
    filter_value: value,
    ...pageContext
  });
};

export const trackPaginationClick = (pageNumber: number, pageContext: { category?: string; subcategory?: string }) => {
  window.dataLayer?.push({
    event: 'pagination_click',
    page_number: pageNumber,
    ...pageContext
  });
};

export const trackProductClick = (product: Product) => {
  window.dataLayer?.push({
    event: 'product_click',
    product: {
      id: product.id,
      name: product.title,
      price: product.price,
      brand: product.brand,
      category: product.category,
      variant: product.variant
    }
  });
};

export const trackProductListView = (products: Product[], listName: string) => {
  window.dataLayer?.push({
    event: 'view_item_list',
    items: products.map(product => ({
      id: product.id,
      name: product.title,
      price: product.price,
      brand: product.brand,
      category: product.category
    })),
    list_name: listName
  });
};

export const trackAddToCart = (product: Product, quantity: number, pageContext?: {
  pageType: 'product' | 'search' | 'category' | 'subcategory' | 'recommendation';
  pageName?: string;
  category?: string;
  subcategory?: string;
  searchQuery?: string;
}) => {
  window.dataLayer?.push({
    event: 'add_to_cart',
    items: [{
      id: product.id,
      name: product.title,
      price: product.price,
      quantity,
      brand: product.brand,
      category: product.category
    }],
    page_context: pageContext || {
      pageType: 'product',
      pageName: window.location.pathname
    }
  });
};

export const trackRemoveFromCart = (product: Product, quantity: number) => {
  window.dataLayer?.push({
    event: 'remove_from_cart',
    items: [{
      id: product.id,
      name: product.title,
      price: product.price,
      quantity,
      brand: product.brand,
      category: product.category
    }]
  });
};

export const trackBeginCheckout = (cartItems: Product[], cartTotal: number) => {
  window.dataLayer?.push({
    event: 'begin_checkout',
    items: cartItems,
    value: cartTotal,
    currency: 'EUR'
  });
};

export const trackAddShippingInfo = (shippingMethod: string, cartTotal: number) => {
  window.dataLayer?.push({
    event: 'add_shipping_info',
    shipping_tier: shippingMethod,
    value: cartTotal,
    currency: 'EUR'
  });
};

export const trackAddPaymentInfo = (paymentMethod: string, cartTotal: number) => {
  window.dataLayer?.push({
    event: 'add_payment_info',
    payment_type: paymentMethod,
    value: cartTotal,
    currency: 'EUR'
  });
};

export const trackPurchase = (orderData: {
  id: string;
  total: number;
  tax: number;
  shipping: number;
  items: Product[];
}) => {
  window.dataLayer?.push({
    event: 'purchase',
    transaction_id: orderData.id,
    value: orderData.total,
    tax: orderData.tax,
    shipping: orderData.shipping,
    currency: 'EUR',
    items: orderData.items.map(item => ({
      id: item.id,
      name: item.title,
      price: item.price,
      quantity: item.quantity,
      brand: item.brand,
      category: item.category
    }))
  });
};

export const trackViewItem = (product: Product) => {
  window.dataLayer?.push({
    event: 'view_item',
    items: [{
      id: product.id,
      name: product.title,
      price: product.price,
      brand: product.brand,
      category: product.category,
      variant: product.variant
    }],
    value: product.price,
    currency: 'EUR'
  });
}; 