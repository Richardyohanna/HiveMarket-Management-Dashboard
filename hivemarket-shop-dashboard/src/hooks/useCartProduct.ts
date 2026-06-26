import { useCallback, useEffect, useMemo, useState } from "react";
import { RecentListingItem } from "../../src/types/products";
import {
    addCartApi,
    getAllCartProductsApi,
    removeFromCartApi,
} from "../api/cartAPi";
import { formatTimeAgo } from "../store/productStore";

export function useCartProduct(userId: string) {
  const [products, setProducts] = useState<RecentListingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─────────────────────────────────────────────
  // FETCH CART
  // ─────────────────────────────────────────────
  const fetchCartProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await getAllCartProductsApi(userId);

      console.log("This is the cart result ", res);

      const mapped: RecentListingItem[] = res.map((p) => ({
        id: String(p.id),
        pImage: p.imageUrls?.[0] || "",
        imageUrls: p.imageUrls || [],
        pName: p.pName,
        pDetail: p.pDetail,
        pAmount: String(p.pAmount),
        pDiscount: String(p.pDiscount ?? ""),
        pTimePosted: p.createdAt ? formatTimeAgo(p.createdAt) : "Just now",
        pQuality: p.pCondition,
        pQuantity: p.pQuantity,
        location: p.location,
        sellerEmail: p.sellerEmail,
        sellerName: p.sellerName,
        sellerId: p.sellerId,
        sellerProfilePicture: p.sellerProfilePicture,
        sellerLocation: p.sellerLocation,
        category: p.category,
        status: p.status,
        createdAt: p.createdAt,
        reactions: p.reactions || 0,
        views: p.views || 0,
        purchases: p.purchases || 0,
        ratingData: p.ratingData || 0,
        isReacted: p.isReacted || false,
      }));

      setProducts(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cart");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // auto-fetch
  useEffect(() => {
    console.log("Started fetching the cart userId:", userId);
    if (userId) fetchCartProduct();
  }, [userId, fetchCartProduct]);

  // ─────────────────────────────────────────────
  // DERIVED: isInCart
  // ─────────────────────────────────────────────
  const isInCart = useCallback(
    (productId: string | number) => {
      return products.some((p) => String(p.id) === String(productId));
    },
    [products]
  );

  // ─────────────────────────────────────────────
  // ADD TO CART
  // ─────────────────────────────────────────────
  const addToCart = useCallback(
    async (userId: string, productId: string, sellerId: string) => {

         console.log("Started adding to cart userId:", userId, " productId: " + productId + " sellerId: " + sellerId);
      try {
        setError(null);

        await addCartApi({
          user_id: userId,
          product_id: productId,
          seller_id: sellerId,
        });

        await fetchCartProduct(); // refresh
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add to cart");
        throw err;
      }
    },
    [fetchCartProduct]
  );

  // ─────────────────────────────────────────────
  // REMOVE FROM CART (optimistic update like Zustand)
  // ─────────────────────────────────────────────
  const removeFromCart = useCallback(
    async (userId: string, productId: string, sellerId: string) => {

         console.log("Started removing the cart userId:", userId, " productId: " + productId + " sellerId: " + sellerId);
      // optimistic UI update
      setProducts((prev) =>
        prev.filter((item) => String(item.id) !== String(productId))
      );

     
      try {
        await removeFromCartApi({
          user_id: userId,
          product_id: productId,
          seller_id: sellerId,
        });
      } catch (err) {
        // rollback by refetching
        await fetchCartProduct();
        setError(err instanceof Error ? err.message : "Failed to remove");
      }
    },
    [fetchCartProduct]
  );

  // ─────────────────────────────────────────────
  // TOTAL VALUE (bonus useful helper)
  // ─────────────────────────────────────────────
  const totalValue = useMemo(() => {
    return products.reduce((sum, item) => {
      return sum + Number(item.pAmount || 0);
    }, 0);
  }, [products]);

  return {
    products,
    loading,
    error,

    // actions
    fetchCartProduct,
    addToCart,
    removeFromCart,
    isInCart,

    // extras
    totalValue,
  };
}