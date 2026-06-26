import { localURL } from "../../../localURL";
import { getToken } from "../services/authStorage";
import { RatingResponse, ReactionRequest, ReactionResponse } from "../types/products";
import { Location } from "../types/User";


 const BASE_URL = `${localURL}/api/products`;

export interface BackendProductRequest {
  pName: string;
  pDetail: string;
  pAmount: number;
  pDiscount?: number;
  pCondition: string;
  pQuantity: number;
  category: string;
  location: Location;
  sellerEmail?: string;
  sellerName?: string;
  sellerImage?: string;
  sellerId?: string; 
  shopId?: string;
}

export interface ProductResponse {
  id: string;
  pName: string;
  pDetail: string;
  pAmount: number;
  pDiscount: number | null;
  pCondition: string;
  pQuantity: number;
  category: string;
  location: Location;
  sellerEmail: string | null;
  sellerName: string | null;
  sellerId: string | null;
  sellerProfilePicture: string | null;
  sellerLocation: string;
  isReacted: boolean;
  status: "PENDING" | "READY" | "FAILED";
  imageUrls: string[];
  createdAt: string;
  reactions: number;
  views: number;
  purchases: number;
  ratingData: RatingResponse;
}

export async function fetchWithTimeout(
  input: RequestInfo,
  init?: RequestInit,
  timeout = 15000
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function addReactionApi(reactData: ReactionRequest, callBack: (data: ReactionResponse)=> void): Promise<void> {
  const token = await getToken();
  if (!token) return;

  if (!token) throw new Error("Not authenticated");
  
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/react`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(reactData),
    });

    const text = await response.text();

    callBack(text ? JSON.parse(text) : null);
    
    console.log("Reaction Updated:", text);
    if (!response.ok) throw new Error(text || "Failed to update reaction");
  }
    catch (error) {
      console.error("addReactionApi error:", error);
      throw error;
    }
}

export async function createProductOnlyApi(
  data: BackendProductRequest
): Promise<ProductResponse> {
  const token = await getToken();

  if (!token) {
    throw new Error("No token found");
  }

  const requestBody = {
    pName: data.pName,
    pDetail: data.pDetail,
    pAmount: data.pAmount,
    pDiscount: data.pDiscount ?? 0,
    pCondition: data.pCondition,
    pQuantity: data.pQuantity,
    category: data.category,
    location: data.location,
    sellerName: data.sellerName,
    sellerImage: data.sellerImage,
    sellerEmail: data.sellerEmail,
    shopId: data.shopId
  };


  console.log("THis is the created Product" , requestBody);
  
  const response = await fetchWithTimeout(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(requestBody),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(responseText || "Failed to create product");
  }

  return JSON.parse(responseText);
}

export async function uploadProductImagesApi(
  productId: string,
  imageUris: string[]
): Promise<ProductResponse> {
  const token = await getToken();

  if (!token) {
    throw new Error("No token found");
  }

  const formData = new FormData();

  imageUris.forEach((uri, index) => {
    const fileName = uri.split("/").pop() || `image_${index}.jpg`;
    const ext = fileName.split(".").pop()?.toLowerCase() || "jpg";

    formData.append("images", {
      uri,
      name: fileName,
      type:
        ext === "jpg" || ext === "jpeg"
          ? "image/jpeg"
          : ext === "png"
          ? "image/png"
          : `image/${ext}`,
    } as any);
  });

  const response = await fetchWithTimeout(`${BASE_URL}/${productId}/images`, {
    method: "POST",
    body: formData,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  }, 30000);

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(responseText || "Failed to upload product images");
  }

  return JSON.parse(responseText);
}

export async function getAllProductsApi(userId: string | null): Promise<ProductResponse[]> {
  
  console.log("Fetching products for userId:", userId);
  
  const response = await fetchWithTimeout(`${BASE_URL}/all?userId=${userId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const data = await response.json();

  console.log("getAllProductsApi response with userID present " + userId + " : ", data);
  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }

  return data.map((p: any) => ({
    ...p,
    views: p.views ?? 0,
    purchases: p.purchases ?? 0,
    rating: p.rating ?? 0,
  }));
}

export async function getAllShopProductsApi(userId: string | null, shopId: string | null): Promise<ProductResponse[]> {
  
  console.log("Fetching products for shopId:", shopId);

   
  const response = await fetchWithTimeout(`${BASE_URL}/shop/all?userId=${userId}&shopId=${shopId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const data = await response.json();

  console.log("getAllProductsApi response with ShopID present " + shopId + " : ", data);
  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }

  return data.map((p: any) => ({
    ...p,
    views: p.views ?? 0,
    purchases: p.purchases ?? 0,
    rating: p.rating ?? 0,
  }));
}


export async function increaseProductPurchaseApi(id: string) {
  const token = await getToken();

  if (!token) return;

  try {
    await fetchWithTimeout(`${BASE_URL}/${id}/purchase`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    console.log("Purchase tracking failed", err);
  }
}

export async function increaseProductViewApi(id: string) {
  try {
    await fetchWithTimeout(`${BASE_URL}/${id}/view`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
      },
    });
  } catch (err) {
    console.log("View tracking failed", err);
  }
}

export async function deleteProductByIdApi(id: string): Promise<void> {
  const token = await getToken();

  if (!token) {
    alert("Hello Anonymous! Please Login to be able to delete products.");
    throw new Error("No token found");
  }

  console.log("deleting product with id:", id);


  const response = await fetchWithTimeout(`${BASE_URL}?id=${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const responseText = await response.text();

  console.log("deleteProductByIdApi response:", responseText);

  if (!response.ok) {
    throw new Error(responseText || "Failed to delete product");
  }
}

export async function getProductByIdApi(
  id: string,
  userId: string
): Promise<ProductResponse> {

  const url = `${BASE_URL}?id=${id}&userId=${userId}`;

  const response = await fetchWithTimeout(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || "Failed to fetch product");
  }

  const data = JSON.parse(text);

  return {
    ...data,
    views: data.views ?? 0,
    purchases: data.purchases ?? 0,
    rating: data.rating ?? 0,
  };
}

export async function getRecentListingsApi(
  userId?: string | null
): Promise<ProductResponse[]> {

  const url = userId
    ? `${BASE_URL}/all?userId=${userId}`
    : `${BASE_URL}/all`;

  const response = await fetchWithTimeout(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || "Failed to fetch recent listings");
  }

  const data = JSON.parse(text);

  return data.map((p: any) => ({
    ...p,
    views: p.views ?? 0,
    purchases: p.purchases ?? 0,
    rating: p.rating ?? 0,
  }));
}

export async function getProductsBySellerIdApi(
  sellerId: string,
  
) {
  
  const response = await fetchWithTimeout(`${BASE_URL}/sellerId/${sellerId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const text = await response.text();

  console.log(`getProductsBySellerIdApi response for sellerId ${sellerId}:`, text);
  
  if (!response.ok) {
    throw new Error(text || "Failed to fetch products by seller ID");
  }

  const data = JSON.parse(text);

  return data.map((p: any) => ({
    ...p,
    views: p.views ?? 0,
    purchases: p.purchases ?? 0,
    rating: p.rating ?? 0,
  }));
}

    