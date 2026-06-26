import { localURL } from "@/localURL";
import { getToken } from "../services/authStorage";

const BASE_URL = `${localURL}/api/payments`;

// ─── Shared helper ────────────────────────────────────────────────────────────
// Reads the body ONCE, logs it, checks ok, then returns the parsed data.
// This prevents the "Already read" error that happens when response.json()
// is called more than once on the same Response object.
async function parseResponse<T = any>(response: Response, label: string): Promise<T> {
  const data = await response.json(); // ← read ONCE here, never again
  console.log(`[paymentApi] ${label}:`, data);

  if (!response.ok) {
    // Try to surface the backend error message if present
    const message =
      (data as any)?.message ??
      (data as any)?.error ??
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

// ─── Auth helper ──────────────────────────────────────────────────────────────
async function getAuthToken(): Promise<string> {
  const token = await getToken();
  if (!token) {
    alert("Please login to be able to buy products");
    throw new Error("User not authenticated");
  }
  return token;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function initializePayment(data: {
  productId: string;
  buyerId: string;
  customerEmail: string;
  amount: number;
  channel?: string; // optional: "card" | "bank_transfer"
}) {
  const token = await getAuthToken();

  const response = await fetch(`${BASE_URL}/initialize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return parseResponse(response, "initializePayment");
}

export async function verifyPayment(reference: string) {
  const token = await getAuthToken();

  const response = await fetch(
    `${BASE_URL}/verify?reference=${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return parseResponse(response, "verifyPayment");
}

export async function chargeCard(data: any) {
  const token = await getAuthToken();

  const response = await fetch(`${BASE_URL}/charge/card`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return parseResponse(response, "chargeCard");
}

export async function submitPin(pin: string, reference: string) {
  const token = await getAuthToken();

  const response = await fetch(`${BASE_URL}/submit-pin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ pin, reference }),
  });

  return parseResponse(response, "submitPin");
}

export async function submitOtp(otp: string, reference: string) {
  const token = await getAuthToken();

  const response = await fetch(`${BASE_URL}/submit-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ otp, reference }),
  });

  return parseResponse(response, "submitOtp");
}

export async function chargeBankTransfer(
  email: string,
  amount: number,
  reference: string
) {
  const token = await getAuthToken();

  const response = await fetch(`${BASE_URL}/charge/bank-transfer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email, amount, reference }),
  });

  return parseResponse(response, "chargeBankTransfer");
}


export async function confirmPayment(data: {
  productId: string;
  buyerId: string;
  sellerId: string;
  reference: string;
}) {
  const token = await getAuthToken();

  const response = await fetch(`${BASE_URL}/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return parseResponse(response, "confirmPayment");
}