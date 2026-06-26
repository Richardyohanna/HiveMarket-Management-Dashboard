

import { localURL } from "@/localURL";
import { getToken } from "../services/authStorage";

const BASE_URL = `${localURL}/api/chat`;

async function fetchWithTimeout(
  input: RequestInfo,
  init?: RequestInit,
  timeout = 15000
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

//
// ── GET CONVERSATIONS ─────────────────────────────────────────────
//

export async function markAsRead(conversationId: string, userId: string) {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetchWithTimeout(
    `${BASE_URL}/conversations/${conversationId}/read?userId=${userId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      }
      
    }
  );

 

  if (!response.ok) {
    throw new Error(await response.text());
  }


}
export async function getConversationsApi(userId: string) {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");

  console.log("Fetching conversations for userId:", userId);

  const response = await fetchWithTimeout(
    `${BASE_URL}/conversations/${userId}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return await response.json();
}

//
// ── GET MESSAGES ─────────────────────────────────────────────
//
export async function getMessagesApi(buyerId: string, sellerId: string) {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetchWithTimeout(
    `${BASE_URL}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ buyerId, sellerId }),
    }
  );

  //console.log("Response from getMessagesApi:", await response.json());

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return await response.json();
}

//
// ── CREATE CONVERSATION ─────────────────────────────────────────────
//
export async function createConversationApi(data: {
  buyerId: string;
  sellerId: string;
  message?: string;
}) {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");

  console.log("Creating conversation with data:", data);
  
  const response = await fetchWithTimeout(
    `${BASE_URL}/conversation`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return await response.json();
}