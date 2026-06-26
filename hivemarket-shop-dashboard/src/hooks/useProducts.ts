import { getAllProductsApi } from "../../src/api/productApi";
import { formatTimeAgo } from "../../src/store/productStore";
import { RecentListingItem } from "../../src/types/products";
import { useCallback, useEffect, useState } from "react";

export function useProducts(userId: string | null) {
  const [products, setProducts] = useState<RecentListingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getAllProductsApi(userId);

      const mapped: RecentListingItem[] = data.map((item) => ({
        id: String(item.id),
        pImage: item.imageUrls?.[0] || "",
        imageUrls: item.imageUrls || [],
        pName: item.pName,
        pDetail: item.pDetail,
        pAmount: String(item.pAmount),
        pDiscount: String(item.pDiscount ?? ""),
        pTimePosted: item.createdAt ? formatTimeAgo(item.createdAt) : "Just now",
        pQuality: item.pCondition,
        pQuantity: item.pQuantity,
        location: item.location,
        sellerEmail: item.sellerEmail,
        sellerName: item.sellerName,
        sellerId: item.sellerId,
        sellerProfilePicture: item.sellerProfilePicture,
        sellerLocation: item.sellerLocation,
        category: item.category,
        status: item.status,
        createdAt: item.createdAt,
        reactions: item.reactions || 0,
        views: item.views || 0,
        purchases: item.purchases || 0,
        ratingData: item.ratingData || 0,
        isReacted: item.isReacted || false,
      }));

      setProducts(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [userId]);


  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
  };
}