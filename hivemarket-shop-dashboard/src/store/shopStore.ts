import { create } from "zustand";
import { Location } from "../types/User";
import { ShopResponse, ShopStoreData } from "../types/shop";

const initialState = {
  id: "",
  name: "",
  ownerName: "",
  phone: "",
  email: "",

  slogan: "",
  shopType: "",
  categories: [] as string[],
  university: "",
  areaName: "",

  location: { address: "", latitude: 0, longitude: 0 } as Location,

  imageUrl: "",
  banner: "",

  followers: 0,
  productCount: 0,

  isOpen: false,

  openTime: "",
  closingTime: "",

  distanceKm: 0,
  walkTimeMinutes: 0,

  createdAt: "",

  isAuthenticated: false,
};

export const shopStore = create<ShopStoreData>((set) => ({
  ...initialState,

  setShop: (value: Partial<ShopResponse>) =>
    set((state) => ({
      id: value.id ?? state.id,
      name: value.name ?? state.name,
      ownerName: value.ownerName ?? state.ownerName,
      phone: value.phone ?? state.phone,
      email: value.email ?? state.email,      
      location: value.location ?? state.location,
      isOpen: value.isOpen ?? state.isOpen,
      imageUrl: value.imageUrl ?? state.imageUrl,
      followers: value.followers ?? state.followers,
      productCount: value.productCount ?? state.productCount,
      slogan: value.slogan ?? state.slogan,
      shopType: value.shopType ?? state.shopType,
      categories: value.categories ?? state.categories,
      university: value.university ?? state.university,
      areaName: value.areaName ?? state.areaName,
      banner: value.banner ?? state.banner,
    })),

  setIsOpen: (value: boolean) => set({isOpen: value}),
  setFollowers: (value: number) => set({ followers: value }),
  setProductCount: (value: number) => set({ productCount: value }),
  setAuthenticated: (value: boolean) => set({ isAuthenticated: value }),

  clearShop: () => set({ ...initialState }),
}));
