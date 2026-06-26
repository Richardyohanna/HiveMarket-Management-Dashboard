import { localURL } from "@/localURL";
import { fetchWithTimeout, ProductResponse } from "../../src/api/productApi";
import { saveToken } from "../services/authStorage";
import {
  Follower,
  ShopAuthResponse,
  ShopLoginRequest,
  ShopRegisterRequest,
  ShopResponse,
  ShopStats,
  ShopUpdateRequest,
} from "../../src/types/shop";
import { getToken } from "../services/authStorage";

const BASE_URL = `${localURL}/api/shops`;
const AUTH_URL = `${localURL}/api/auth`
const PRODUCTS_URL = `${localURL}/api/products`;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function imagePart(uri: string, field = "image") {
  const fileName = uri.split("/").pop() || `${field}.jpg`;
  const ext = fileName.split(".").pop()?.toLowerCase() || "jpg";
  const type =
    ext === "jpg" || ext === "jpeg"
      ? "image/jpeg"
      : ext === "png"
      ? "image/png"
      : `image/${ext}`;
  return { uri, name: fileName, type } as any;
}

async function authHeaders(extra: Record<string, string> = {}) {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated as a shop");
  return { Authorization: `Bearer ${token}`, ...extra };
}

/* -------------------------------------------------------------------------- */
/*  Auth                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Registers a shop. Sends every field plus the profile image as a single
 * multipart/form-data request:  POST /api/shops/register
 *
 * Matches the exact call signature requested:
 *   registerShopApi({ name, password, ownerName, phone, email, location, image })
 */
export async function registerShopApi(
  data: ShopRegisterRequest
): Promise<ShopAuthResponse> {
  const form = new FormData();
  form.append("name", data.name);
  form.append("password", data.password);
  form.append("ownerName", data.ownerName);
  form.append("phone", data.phone);
  form.append("email", data.email);
  form.append("address", data.location.address);
  form.append("latitude", String(data.location.latitude));
  form.append("longitude", String(data.location.longitude));
  form.append("slogan", data.slogan);
  form.append("shopType", data.shopType);

  form.append("university", data.university);
  form.append("areaName", data.areaName);

  if (data.banner) {
    form.append("banner", imagePart(data.banner, "banner"));
  }
  data.categories.forEach(category =>
      form.append("categories", category)
  );
  if (data.image) {
    form.append("image", imagePart(data.image));
  }

  const response = await fetchWithTimeout(
    `${AUTH_URL}/register/shop`,
    {
      method: "POST",
      headers: { Accept: "application/json" },
      body: form,
    },
    30000
  );

  const text = await response.text();
  if (!response.ok) throw new Error(text || "Shop registration failed");

  const parsed: ShopAuthResponse = JSON.parse(text);

  saveToken(parsed.token)
  return parsed;
}

/** POST /api/shops/login */
export async function loginShopApi(
  data: ShopLoginRequest
): Promise<ShopAuthResponse> {
  const response = await fetchWithTimeout(`${AUTH_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(data),
  });

  const text = await response.text();
  if (!response.ok) throw new Error(text || "Login failed");

  const parsed = JSON.parse(text);

  console.log( "This is the parsed data" , parsed)
  saveToken(parsed.token)
  return parsed;
}

/* -------------------------------------------------------------------------- */
/*  Shop profile                                                              */
/* -------------------------------------------------------------------------- */

/** GET /api/shops/{shopId} */
export async function getShopByIdApi(shopId: string): Promise<ShopResponse> {
  const response = await fetchWithTimeout(`${BASE_URL}/${shopId}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || "Failed to fetch shop");
  return JSON.parse(text);
}

/** PUT /api/shops/{shopId} (multipart so the logo can be replaced) */
export async function updateShopApi(
  data: ShopUpdateRequest
): Promise<ShopResponse> {
  const form = new FormData();
  form.append("name", data.name);
  form.append("ownerName", data.ownerName);
  form.append("phone", data.phone);
  form.append("email", data.email);
  form.append("address", data.location.address);
  form.append("latitude", String(data.location.latitude));
  form.append("longitude", String(data.location.longitude));
  if (data.image && !data.image.startsWith("http")) {
    form.append("image", imagePart(data.image));
  }

  const response = await fetchWithTimeout(
    `${BASE_URL}/${data.id}`,
    {
      method: "PUT",
      headers: await authHeaders({ Accept: "application/json" }),
      body: form,
    },
    30000
  );

  const text = await response.text();
  if (!response.ok) throw new Error(text || "Failed to update shop");
  return JSON.parse(text);
}

/* -------------------------------------------------------------------------- */
/*  Stats & followers                                                         */
/* -------------------------------------------------------------------------- */

/** GET /api/shops/{shopId}/stats */
export async function getShopStatsApi(shopId: string): Promise<ShopStats> {
  const response = await fetchWithTimeout(`${BASE_URL}/${shopId}/stats`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || "Failed to fetch shop stats");
  const data = JSON.parse(text);
  return {
    followers: data.followers ?? 0,
    totalProducts: data.totalProducts ?? 0,
    totalViews: data.totalViews ?? 0,
    totalSales: data.totalSales ?? 0,
    revenue: data.revenue ?? 0,
    reactions: data.reactions ?? 0,
  };
}

/** GET /api/shops/{shopId}/followers */
export async function getShopFollowersApi(shopId: string): Promise<Follower[]> {
  const response = await fetchWithTimeout(`${BASE_URL}/${shopId}/followers`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || "Failed to fetch followers");
  const data = JSON.parse(text);
  // Accept either { count, followers: [] } or a bare array.
  const list = Array.isArray(data) ? data : data.followers ?? [];
  return list.map((f: any) => ({
    id: String(f.id),
    full_name: f.full_name ?? f.fullName ?? "Student",
    profile_picture: f.profile_picture ?? f.profilePicture ?? null,
    university: f.university,
    followedAt: f.followedAt,
  }));
}

/* -------------------------------------------------------------------------- */
/*  Products (shop-scoped)                                                    */
/* -------------------------------------------------------------------------- */

export interface ShopProductRequest {
  pName: string;
  pDetail: string;
  pAmount: number;
  pDiscount?: number;
  pCondition: string;
  pQuantity: number;
  category: string;
  location: Location;
  shopId: string;
}

/** POST /api/products  (creates a product owned by the shop) */
export async function createShopProductApi(
  data: ShopProductRequest
): Promise<ProductResponse> {

  const token = await getToken();

  if(token == null || token == "" ) {

    throw new Error("Please Register to be able to access this ");
  }
  const response = await fetchWithTimeout(PRODUCTS_URL, {
    method: "POST",
    headers: await authHeaders({
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    }),
    body: JSON.stringify({ ...data, pDiscount: data.pDiscount ?? 0 }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || "Failed to create product");
  return JSON.parse(text);
}

/** PUT /api/products/{id}  (edit / update an existing product) */
export async function updateShopProductApi(
  id: string,
  data: ShopProductRequest
): Promise<ProductResponse> {
  const response = await fetchWithTimeout(`${PRODUCTS_URL}/${id}`, {
    method: "PUT",
    headers: await authHeaders({
      "Content-Type": "application/json",
      Accept: "application/json",
    }),
    body: JSON.stringify({ ...data, pDiscount: data.pDiscount ?? 0 }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || "Failed to update product");
  return JSON.parse(text);
}

/** POST /api/products/{id}/images  (mirrors uploadProductImagesApi) */
export async function uploadShopProductImagesApi(
  productId: string,
  imageUris: string[]
): Promise<ProductResponse> {
  const form = new FormData();
  imageUris
    .filter((uri) => uri && !uri.startsWith("http"))
    .forEach((uri, i) => form.append("images", imagePart(uri, `image_${i}`)));

  const response = await fetchWithTimeout(
    `${PRODUCTS_URL}/${productId}/images`,
    {
      method: "POST",
      headers: await authHeaders({ Accept: "application/json" }),
      body: form,
    },
    30000
  );
  const text = await response.text();
  if (!response.ok) throw new Error(text || "Failed to upload product images");
  return JSON.parse(text);
}
