
export type CartRequest = {
    user_id: string;
    product_id: string;
    seller_id: string;
}

// src/types/Cart.ts



// matches your Spring Boot CartResponse DTO body
export interface CartResponse {
  user_id: string;
  product_id: string;
  seller_id: string;
}

export interface CartStoreType {
  cartItems:    import('./products').RecentListingItem[];
  loading:      boolean;
  error:        string | null;

  // actions
  fetchCart:       (userId: string) => Promise<void>;
  addToCart:       (userId: string, productId: string, sellerId: string) => Promise<void>;
  removeFromCart:  (userId: string, productId: string, sellerId: string) => Promise<void>;
  clearLocalCart:  () => void;
  isInCart:        (productId: string | number) => boolean;

  // derived — used by _layout badge
  savedIds: string[];
}