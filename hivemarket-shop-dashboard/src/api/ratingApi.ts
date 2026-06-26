import { localURL } from "@/localURL";
import { Alert } from "react-native";
import { getToken } from "../services/authStorage";
import { RatingRequest, RatingResponse } from "../types/products";
import { fetchWithTimeout } from "./productApi";

const BASE_URL = `${localURL}/api/rating`

export async function rate(request: RatingRequest) {
  try {
    const token = await getToken();

    console.log("this is the rating request" , request);
    console.log("This is the token rating", token);

    if (token == null || request.userId == "") {
      Alert.alert("Login Required", "Please Login, so that your rating can have effect to this product");
      return;
    };

    const response = await fetchWithTimeout(`${BASE_URL}/rate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    const data: RatingResponse = await response.json();

    if (!response.ok) {
      throw new Error("Failed to submit rating");
    }

    console.log("Rating Response:", data);

    return data;
  } catch (error) {
    console.error("rate API error:", error);
    throw error;
  }
}