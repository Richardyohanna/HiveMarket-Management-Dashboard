
		  


export type Order = {
    OrderId: string;
    productId: string;
    productName: string;
    amountPaid: number;
    orderDate: string;
    deliveredDate: string;
    status: string;
    productImage: {
        id: number;
        imageUrl: string;
    };
}