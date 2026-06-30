
		  


export type OrderStatus = "IN_PROGRESS" | "IN_TRANSIT" | "DELIVERED" | "ALL"  | "CANCELLED";

export interface Order {

    OrderId: string;

    productId: string;

    productName: string;

    buyerName: string;

    quantity: number;

    address: string;

    location: Location;

    amountPaid: number;

    orderDate: string;

    deliveredDate: string;

    status: OrderStatus;

    productImage: {
        id: number;
        imageUrl: string;
    };
}

export interface TransitLocation {
  checkpoint: string;
  timestamp: string;
  note?: string;
}

export interface OrderDetail {
  orderId: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;

  // Buyer
  buyer: {
    name: string;
    phone: string;
    email: string;
    university: string;
   // faculty?: string;
   // level?: string; // e.g. "300 Level"
    // hostel?: string;
    avatar?: string | null;
  };

  // Delivery
  delivery: {
    address: string;
    landmark?: string;
    campus: string;
    estimatedDate?: string;
    trackingId?: string;
    currentLocation?: string;
    transitHistory?: TransitLocation[];
  };

  // Product
  product: {
    id: string;
    name: string;
    imageUrl: string | null;
    category: string;
    condition: string; // "New" | "Used - Like New" | "Used - Good"
    description: string;
    unitPrice: number;
  };

  // Order
  quantity: number;
  subtotal: number;
  platformFee: number;
  total: number;

  // Transaction
  transaction: {
    reference: string;
    //channel: string; // "card" | "bank_transfer" | "ussd"
    paidAt: string;
    settlementStatus: "pending" | "settled";
    amountToReceive: number;
  };

  notes?: string;
}