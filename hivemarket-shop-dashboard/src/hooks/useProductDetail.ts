import { useCallback, useEffect, useState } from "react";
import {
    getProductByIdApi,
    getRecentListingsApi,
    ProductResponse,
} from "../api/productApi";

export function useProductDetail(productId: string, userId: string | null) {
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [recentListings, setRecentListings] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Load single product ──
  const loadProduct = useCallback(async () => {
    if (!productId) return;

    try {
      setLoading(true);

      const data = await getProductByIdApi(productId, userId || "");
      setProduct(data);

      // optional: increase view
    } catch (err) {
      console.error("Failed to load product:", err);
    } finally {
      setLoading(false);
    }
  }, [productId, userId]);

  // ── Load recent listings ──
  const loadRecentListings = useCallback(async (uid: string | null) => {
    try {
      const data = await getRecentListingsApi(uid);
      setRecentListings(data);
    } catch (err) {
      console.error("Failed to load recent listings:", err);
    }
  }, []);

  // ── refresh helper ──
  const refresh = useCallback(() => {
    loadProduct();
    loadRecentListings(userId);
  }, [loadProduct, loadRecentListings, userId]);

  // ── initial load ──
  useEffect(() => {
    loadProduct();
    loadRecentListings(userId);
  }, [productId, userId]);



  return {
    product,
    recentListings,
    loading,
    refresh,
    loadRecentListings,
  };



  
}