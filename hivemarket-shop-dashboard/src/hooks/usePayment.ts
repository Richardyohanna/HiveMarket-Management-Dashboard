import * as Linking from "expo-linking";
import { useState } from "react";
import { initializePayment, verifyPayment } from "../api/paymentApi";

export const usePayment = () => {
  const [loading, setLoading] = useState(false);

  const startPayment = async (payload: {
    productId: string;
    buyerId: string;
    customerEmail: string;
    amount: number;
  }) => {
    try {
      setLoading(true);

      const init = await initializePayment(payload);

      console.log("INIT:", init);

      // Open Paystack checkout
      await Linking.openURL(init.authorizationUrl);

      return init; // contains reference

    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (reference: string) => {
    try {
      const res = await verifyPayment(reference);
      console.log("VERIFY:", res);
      return res;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  return {
    startPayment,
    confirmPayment,
    loading,
  };
};