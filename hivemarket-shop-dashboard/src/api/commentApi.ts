import { localURL } from "../../../localURL";
import { getToken } from "../services/authStorage";
import { CommentRequest, CommentResponse } from "../types/products";
import { fetchWithTimeout } from "./productApi";


const BASE_URL = `${localURL}/api/comment`


export async  function addComment(commentRequest: CommentRequest): Promise<void> {

    const token = await getToken(); // Implement this function to retrieve the auth token
    
    if (!token) {

        alert("Hello Anonymous! Please Login to be able to add comments.");
        throw new Error("User is not authenticated");
    }
    
    const response = await fetchWithTimeout(`${BASE_URL}/add-comment`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(commentRequest)
    });

    const text = await response.text();

    console.log("addComment response:", text);

    if (!response.ok) {
        throw new Error("Failed to add comment");
    }

    return JSON.parse(text);
}

export async function getComments(productId: string , userId: string): Promise<CommentResponse[]> {

    console.log("This are the data used to retrieve the comment for the product " , productId, userId);

    const response = await fetch(`${BASE_URL}/all?productId=${productId}&userId=${userId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        }
    });

    const text = await response.text();

    console.log("getComments response:", text);

    if (!response.ok) {
        throw new Error("Failed to fetch comments");
    }
    
    return JSON.parse(text);

}

export async function likeComment(commentId: string, userId: string){

    const token = await getToken();

    if(!token) {
        alert("Hello Anonymous! Please Login to be able to like comments.");
        throw new Error("User is not authenticated");
    }

    const response = await fetch(`${BASE_URL}/add-like?commentId=${commentId}&userId=${userId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ commentId, userId })
    });

    const text = await response.text();

    console.log("likeComment response:", text);

    if (!response.ok) {
        throw new Error("Failed to like comment");
    }

    return JSON.parse(text);
}