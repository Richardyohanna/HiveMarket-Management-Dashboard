import { Location } from "./User";

export type ProductCondition =
  | "NEW"
  | "LIKE NEW"
  | "UK USED"
  | "GOOD"
  | "FAIR"
  | "USED";

export interface CreateProductPayload {
  pName: string;
  pDetail: string;
  pAmount: number;
  pDiscount?: number;
  pCondition: ProductCondition;
  pQuantity: number;
  category: string;
  location: Location;
  images: string[];
  sellerName: string;
  sellerImage: string;
  sellerEmail: string;
}

export interface RatingRequest {

  userId: string;
  productId: string;
  rating: number;

}

export interface RatingResponse {
  	AverageRating: number;
		userRating: number;
		totalFiveRating: number;
		totalFourRating: number;
		totalThreeRating: number;
		totalTwoRating: number;
		totalOneRating: number;
    totalRating: number;
}

export interface ProductResponse {
  id: string;
  pName: string;
  pDetail: string;
  pAmount: number;
  pDiscount: number | null;
  pCondition: ProductCondition;
  pQuantity: number;
  category: string;
  location: Location;
  sellerEmail: string | null;
  sellerName: string | null;
  sellerId: string | null;
  sellerProfilePicture: string | null;
  isReacted: boolean;
  status: "PENDING" | "READY" | "FAILED";
  imageUrls: string[];
  createdAt: string;



  reactions: number;
  views: number;
  purchases: number;
  ratingData: RatingResponse;
}

export interface CreateProductResult {
  success: boolean;
  productId?: string;
}

export interface RecentListingItem {
  id: string;
  pImage: string;
  imageUrls: string[];
  pName: string;
  pDetail: string;
  pAmount: string;
  pDiscount?: string;
  pTimePosted: string;
  category: string;
  pStatus?: "SOLD" | "AVAILABLE";
  pQuality: string;
  pQuantity: number;
  location?: Location;
  sellerEmail?: string | null;
  sellerId?: string | null;
  sellerName?: string | null;
  sellerProfilePicture?: string | null;
  sellerLocation?: string;
  isReacted: boolean;
  status: "PENDING" | "READY" | "FAILED";

 
  createdAt: string;

  reactions: number;
  views: number;
  purchases: number;
  ratingData: RatingResponse;
}

export interface ReactionRequest {
  productId: string;
  userId: string;
}

export interface ReactionResponse {
  productId: string;
  userId: string;
  isReacted: boolean;
  reactions: number;
}

export interface CommentResponse {
  id: string;
  aurthor: string;
  avatar?: string;
  text: string;   
  likes: number;
  rating: number;
  likedByMe: boolean;
  reported: boolean;
  createdAt: string;
  
};

export interface CommentRequest { 
  aurthorId: string;
  productId: string;
  text: string;   
}


export interface ProductStore {
  productName: string;
  description: string;
  price: string;
  category: string;
  condition: ProductCondition;
  quantity: number,
  location: Location;
  images: string[];
  sellerEmail: string;
  sellerId: string;
  sellerName: string;
  sellerImage: string;
  sellerLocation: string;
  isReacted: boolean;
  

  recentListings: RecentListingItem[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;

  setSellerId: (value: string) => void;
  setProductName: (value: string) => void;
  setDescription: (value: string) => void;
  setPrice: (value: string) => void;
  setCategory: (value: string) => void;
  setCondition: (value: ProductCondition) => void;
  setLocation: (value: Location) => void;
  setSellerEmail: (value: string) => void;
  setSellerName: (value: string) => void;
  setSellerImage: (value: string) => void;
  setSellerLocation: (value: string) => void;
  setProductQuantity: (value: number) => void;
  

  addImages: (newImages: string[]) => void;
  removeImage: (index: number) => void;
  clearForm: () => void;

}