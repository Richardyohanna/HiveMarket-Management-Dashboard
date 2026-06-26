// src/api/cartApi.ts

import { localURL } from "@/localURL";
import { getToken } from "../services/authStorage";
import { CartResponse } from "../types/Cart";
import { ProductResponse } from "./productApi";

const BASE_URL = `${localURL}/api/cart`;

async function fetchWithTimeout(
  input: RequestInfo,
  init?: RequestInit,
  timeout = 15000
) {
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}


// ── POST /api/cart/addCart ────────────────────────────────────────────────────
// Body: { user_email, product_id }
export async function addCartApi(request: CartResponse): Promise<void> {
  try {
    const token = await getToken();
    if (!token) return;

    const response = await fetchWithTimeout(`${BASE_URL}/addCart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // NOTE: your backend has a typo "Authorisation" — keep it matching
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    const text = await response.text();
    console.log("Cart Added:", text);

    if (!response.ok) throw new Error(text || "Failed to add to cart");
  } catch (error) {
    console.error("addCartApi error:", error);
    throw error;
  }
}

// ── GET /api/cart/all?user_email=xxx ─────────────────────────────────────────
// Returns List<ProductResponse> from your backend
export async function getAllCartProductsApi(userId: string): Promise<ProductResponse[]> {
  try {
    const token = await getToken();
    if (!token) throw new Error("Not authenticated");

    console.log(userId, "is the user ID used to fetch cart products");
    const response = await fetchWithTimeout(
      `${BASE_URL}/all?userId=${userId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Authorization": `Bearer ${token}`,
        },
      }
    );

    console.log(userId, "cannot fetch cart products, response status:", response.status);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText + "TEST" || "Failed to fetch cart");
    }

    const data = await response.json();
    
    console.log(data, "is the cart products data received from backend");
    return data.map((p: any) => ({
      ...p,
      views:     p.views     ?? 0,
      purchases: p.purchases ?? 0,
      rating:    p.rating    ?? 0,
    }));
  } catch (error) {
    console.error("getAllCartProductsApi error:", error);
    throw error;
  }
}

// ── DELETE /api/cart/ ─────────────────────────────────────────────────────────
// Body: { user_email, product_id }
export async function removeFromCartApi(request: CartResponse): Promise<void> {
  try {
    const token = await getToken();
    if (!token) return;

    const response = await fetchWithTimeout(`${BASE_URL}/`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    const text = await response.text();
    console.log("Cart removed:", text);

    if (!response.ok) throw new Error(text || "Failed to remove from cart");
  } catch (error) {
    console.error("removeFromCartApi error:", error);
    throw error;
  }
}