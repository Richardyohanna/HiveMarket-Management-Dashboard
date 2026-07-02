import { Location } from "./User";

/**
 * The exact payload requested for shop registration.
 * `image` is a local file URI (from expo-image-picker) that is
 * uploaded as multipart/form-data inside registerShopApi.
 */


export interface ShopRegisterRequest {
  name: string;
  password: string;
  ownerName: string;
  phone: string;
  email: string;
  slogan: string;
  shopType: string;
  categories: string[];
  university: string;
  areaName: string;
  location: Location;
  image: string; 
  banner: string;
}

export interface ShopLoginRequest {
  email: string;
  password: string;
}


export interface ShopResponse {
  id: string;

  name: string;
  ownerName: string;
  phone: string;
  email: string;

  slogan: string;
  shopType: string;
  categories: string[];
  university: string;
  areaName: string;

  imageUrl: string;
  banner: string;

  location: Location;

  followers: number;
  productCount: number;

  isOpen: boolean;

  openTime: string;
  closingTime: string;

  distanceKm: number;
  walkTimeMinutes: number;

  createdAt: string;

  pendingCount: number;
  inTransitCount: number;
  deliveredCount: number;

}

export interface ShopAuthResponse {
  token: string;
  shop: ShopResponse;
}

export interface ShopStats {
  followers: number;
  totalProducts: number;
  totalViews: number;
  totalSales: number;
  revenue: number;
  reactions: number;
}


export interface Follower {
  id: string;
  full_name: string;
  profile_picture: string | null;
  university?: string;
  followedAt?: string;
}

/** Editable shop profile fields. */
export interface ShopUpdateRequest {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  location: Location;
  image?: string; // optional new local uri
}

export interface ShopStoreData {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  email: string;

  slogan: string;
  shopType: string;
  categories: string[];
  university: string;
  areaName: string;

  imageUrl: string;
  banner: string;

  location: Location;

  followers: number;
  productCount: number;

  isOpen: boolean;

  openTime: string;
  closingTime: string;

  distanceKm: number;
  walkTimeMinutes: number;

  createdAt: string;

  pendingCount: number;
  inTransitCount: number;
  deliveredCount: number;

  isAuthenticated: boolean;


  setIsOpen: (value: boolean) => void;
  setShop: (value: Partial<ShopResponse>) => void;
  setFollowers: (value: number) => void;
  setProductCount: (value: number) => void;
  setAuthenticated: (value: boolean) => void;
  clearShop: () => void;
}
