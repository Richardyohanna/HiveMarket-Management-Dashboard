import { formatTimeAgo } from "../../src/store/productStore";
import { RecentListingItem } from "../../src/types/products";
import { useCallback, useEffect, useState } from "react";
import { getProductsBySellerIdApi } from "../api/productApi";

export function useSellerProduct(sellerId: string){
    const [products, setProducts] = useState<RecentListingItem[]>([]);

    const fetchProductsBySeller = useCallback(async () => {
        try {
          const data = await getProductsBySellerIdApi(sellerId);

          console.log("Fetched products by seller ID:", data);
          
        const mapped: RecentListingItem[] = data.map((item: any) => ({
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
            rating: item.rating || 0,
            isReacted: item.isReacted || false,
        }));
    
        setProducts(mapped);

         
        } catch (err) {
          console.error("Failed to fetch products by seller ID:", err);
        }
    }, [sellerId]);


  useEffect(() => {
    fetchProductsBySeller();
  }, [fetchProductsBySeller]);

    return {
        products,
        fetchProductsBySeller
    };
}