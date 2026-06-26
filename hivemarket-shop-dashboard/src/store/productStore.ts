import { create } from "zustand";
import {
  ProductCondition,
  ProductStore,
  RecentListingItem
} from "../types/products";

export function formatTimeAgo(dateString: string): string {

  console.log(dateString, "This is the date of the comment");
  
  if (!dateString) return "Unknown time";

  let normalized = dateString;

  // CASE 1: has microseconds (e.g. .346125)
  if (/\.\d{3,}/.test(dateString)) {
    // keep only first 3 digits of milliseconds
    normalized = dateString.replace(
      /\.(\d{3})\d+/,
      ".$1"
    );
  }

  // CASE 2: missing timezone (no Z, no offset)
  const hasTimezone =
    dateString.includes("Z") ||
    dateString.includes("+") ||
    dateString.includes("-");

  if (!hasTimezone) {
    normalized += "Z";
  }

  const posted = new Date(normalized).getTime();
  if (isNaN(posted)) return "Invalid date";

  const now = Date.now();
  const diffMs = now - posted;

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

const initialState = {
  productName: "",
  description: "",
  price: "",
  category: "Select category",
  condition: "NEW" as ProductCondition,
  quantity: 0,
  location: {
    address: "",
    latitude: 0,
    longitude: 0
  },
  images: [],
  sellerName: "",
  sellerEmail: "",
  sellerImage: "",
  sellerId: "",
  sellerLocation: "",
  isReacted: false,
  recentListings: [] as RecentListingItem[],
  loading: false,
  error: null as string | null,
  successMessage: null as string | null,

  views:  0,
  purchases:  0,
  rating: 0,
};

/*
export const useProductStore = create<ProductStore>((set, get) => ({
  ...initialState,

  setProductName: (value: string) => set({ productName: value }),
  setDescription: (value: string) => set({ description: value }),
  setPrice: (value: string) => set({ price: value }),
  setCategory: (value: string) => set({ category: value }),
  setCondition: (value: ProductCondition) => set({ condition: value }),
  setLocation: (value: string) => set({ location: value }),
  setSellerName: (value: string) => set({ sellerName: value }),
  setSellerEmail: (value: string) => set({ sellerEmail: value }),
  setSellerImage: (value: string) => set({ sellerImage: value }),
  setProductQuantity: (value: number) => set({quantity: value}),
  setSellerId: (value: string) => set({sellerId: value}),
  setSellerLocation: (value: string) => set({sellerLocation: value}),

  addImages: (newImages: string[]) =>
    set((state) => ({
      images: [...state.images, ...newImages].slice(0, 10),
    })),

  removeImage: (index: number) =>
    set((state) => ({
      images: state.images.filter((_, i) => i !== index),
    })),

  clearForm: () =>
    set((state) => ({
      productName: "",
      description: "",
      price: "",
      category: "Select category",
      condition: "NEW",
      quantity: 0,
      location: "",
      images: [],
      loading: false,
      error: null,
      successMessage: null,
      recentListings: state.recentListings,
    })),

  setRecentListings: (products: RecentListingItem[]) =>
    set({ recentListings: products }),

  addRecentListing: (product: RecentListingItem) =>
    set((state) => ({
      recentListings: [product, ...state.recentListings],
    })),

  updateRecentListing: (id: string, updated: Partial<RecentListingItem>) =>
    set((state) => ({
      recentListings: state.recentListings.map((item) =>
        item.id === id ? { ...item, ...updated } : item
      ),
    })),

  loadRecentListings: async (userId: string | null) => {
    try {
      set({ loading: true, error: null });

      console.log("Loading recent listings for userId:", userId);
      
      const products = await getAllProductsApi(userId);

      console.log("Fetched products from API:", products);

      const mappedProducts: RecentListingItem[] = products.map((item) => ({
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

        // ✅ ADD THIS
        createdAt: item.createdAt,

        reactions: item.reactions || 0,
        views: item.views || 0,
        purchases: item.purchases || 0,
        rating: item.rating || 0,
        isReacted: item.isReacted || false,
      }));

      set({
        recentListings: mappedProducts,
        loading: false,
        error: null,
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Failed to fetch products",
      });
    }
  },

  createProduct: async (): Promise<CreateProductResult> => {
    const {
      productName,
      description,
      price,
      category,
      condition,
      quantity,
      location,
      images,
      sellerEmail,
      sellerImage,
      sellerName,
      sellerId
    } = get();

    if (!productName.trim()) {
      set({ error: "Product name is required", successMessage: null });
      return { success: false };
    }

    if (category === "Select category") {
      set({ error: "Please select a category", successMessage: null });
      return { success: false };
    }

    if (!price.trim()) {
      set({ error: "Price is required", successMessage: null });
      return { success: false };
    }

    if (isNaN(Number(price))) {
      set({ error: "Price must be a valid number", successMessage: null });
      return { success: false };
    }

    if (!description.trim()) {
      set({ error: "Product description is required", successMessage: null });
      return { success: false };
    }

    if (!location.trim()) {
      set({ error: "Location is required", successMessage: null });
      return { success: false };
    }

    if (images.length === 0) {
      set({ error: "Please add at least one image", successMessage: null });
      return { success: false };
    }

    try {
      set({
        loading: true,
        error: null,
        successMessage: null,
      });

      const currentImages = [...images];

      const createdProduct = await createProductOnlyApi({
        pName: productName,
        pDetail: description,
        pAmount: Number(price),
        pDiscount: 0,
        pCondition: condition,
        pQuantity: quantity,
        category,
        location,
        sellerEmail,
        sellerImage,
        sellerName,
        sellerId: sellerId,
      });

      const optimisticItem: RecentListingItem = {
        id: String(createdProduct.id),
        pImage: currentImages[0] || "",
        imageUrls: currentImages || [],
        pName: createdProduct.pName,
        pDetail: createdProduct.pDetail,
        pAmount: String(createdProduct.pAmount),
        pTimePosted: createdProduct.createdAt
          ? formatTimeAgo(createdProduct.createdAt)
          : "Just now",
        pQuality: createdProduct.pCondition,
        pQuantity: createdProduct.pQuantity,
        sellerEmail: createdProduct.sellerEmail,
        sellerName: createdProduct.sellerName,
        sellerId: createdProduct.sellerId,
        category: createdProduct.category,
        sellerProfilePicture: createdProduct.sellerProfilePicture,
        sellerLocation: createdProduct.sellerLocation,
        isReacted: createdProduct.isReacted,
        status: "PENDING",

        // ✅ ADD THIS
        createdAt: createdProduct.createdAt || new Date().toISOString(),

        reactions: createdProduct.reactions || 0,
        views: createdProduct.views || 0,
        purchases: createdProduct.purchases || 0,
        rating: createdProduct.rating || 0,
      };
      
      set((state) => ({
        recentListings: [optimisticItem, ...state.recentListings],
        productName: "",
        description: "",
        price: "",
        category: "Select category",
        condition: "NEW",
        quantity: 0 ,
        location: "",
        images: [],
        loading: false,
        error: null,
        successMessage: "Post created. Images are uploading...",


      }));

      uploadProductImagesApi(createdProduct.id, currentImages)
        .then((updatedProduct) => {
          set((state) => ({
            recentListings: state.recentListings.map((item) =>
              item.id === String(createdProduct.id)
                ? {
                    ...item,
                    pImage: updatedProduct.imageUrls?.[0] || item.pImage,
                    status: "READY",
                  }
                : item
            ),
            successMessage: "Product uploaded successfully",
            error: null,
          }));
        })
        .catch((error) => {
          set((state) => ({
            recentListings: state.recentListings.map((item) =>
              item.id === String(createdProduct.id)
                ? { ...item, status: "FAILED" }
                : item
            ),
            error:
              error instanceof Error
                ? error.message
                : "Product created, but image upload failed",
            successMessage: null,
          }));
        });

      return { success: true, productId: createdProduct.id };
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Something went wrong",
        successMessage: null,
      });

      return { success: false };
    }
  },
})); */

export const useProductStore = create<ProductStore>((set, get) => ({
  ...initialState,

  setProductName: (value) => set({ productName: value }),
  setDescription: (value) => set({ description: value }),
  setPrice: (value) => set({ price: value }),
  setCategory: (value) => set({ category: value }),
  setCondition: (value) => set({ condition: value }),
  setLocation: (value) => set({ location: value }),
  setSellerName: (value) => set({ sellerName: value }),
  setSellerEmail: (value) => set({ sellerEmail: value }),
  setSellerImage: (value) => set({ sellerImage: value }),
  setProductQuantity: (value) => set({ quantity: value }),
  setSellerId: (value) => set({ sellerId: value }),
  setSellerLocation: (value) => set({ sellerLocation: value }),

  addImages: (newImages) =>
    set((state) => ({
      images: [...state.images, ...newImages].slice(0, 10),
    })),

  removeImage: (index) =>
    set((state) => ({
      images: state.images.filter((_, i) => i !== index),
    })),

  clearForm: () =>
    set({
      productName: "",
      description: "",
      price: "",
      category: "Select category",
      condition: "NEW",
      quantity: 0,
      location: {
        address: "",
        latitude: 0,
        longitude: 0,
      },
      images: [],
      loading: false,
      error: null,
      successMessage: null,
    }),
}));