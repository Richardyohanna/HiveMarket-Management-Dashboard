import { localURL } from "@/localURL";
import { getToken } from "../services/authStorage";

const BASE_URL = `${localURL}/api/order`;


export async function getAllOrderApi(userId: string) {

    const token = await getToken();

    if(token == null) {

        console.log("Please login to be able to get the order list");

        return;
    }

    const response = await fetch(`${BASE_URL}/all?userId=${userId}`, {
        method: "GET",
        headers: {
            "Content-type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    })

    const data = await response.json();

    console.log("This is the response of allOrder" , data);

    if(!response.ok){
        console.log("Cannot get all rge order there is an error")
    }

    return data;
}


export async function getAllIn_ProgressOrderApi(userId: string) {

    const token = await getToken();

    if(token == null) {

        console.log("Please login to be able to get the order list");

        return;
    }

    const response = await fetch(`${BASE_URL}/in_progress?userId=${userId}`, {
        method: "GET",
        headers: {
            "Content-type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    })

    const data = await response.json();

    console.log("This is the response of all in_progress Order" , data);

    if(!response.ok){
        console.log("Cannot get all rge order there is an error")
    }

    return data;
}

export async function getAllDeliveredOrderApi(userId: string) {

    const token = await getToken();

    if(token == null) {

        console.log("Please login to be able to get the order list");

        return;
    }

    const response = await fetch(`${BASE_URL}/delivered?userId=${userId}`, {
        method: "GET",
        headers: {
            "Content-type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    })

    const data = await response.json();

    console.log("This is the response of all delivered Order" , data);

    if(!response.ok){
        console.log("Cannot get all  order there is an error")
    }

    return data;
}


export async function getAllCancelledOrderApi(userId: string) {

    const token = await getToken();

    if(token == null) {

        console.log("Please login to be able to get the order list");

        return;
    }

    const response = await fetch(`${BASE_URL}/cancelled?userId=${userId}`, {
        method: "GET",
        headers: {
            "Content-type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    })

    const data = await response.json();

    console.log("This is the response of allOrder" , data);

    if(!response.ok){
        console.log("Cannot get all rge order there is an error")
    }

    return data;
}