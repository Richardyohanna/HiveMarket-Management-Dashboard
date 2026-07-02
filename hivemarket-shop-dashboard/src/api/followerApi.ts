import  { localURL } from "../../../localURL";
import { getToken } from "../services/authStorage";
import { Follower } from "../types/Follower";

const BASE_URL = `${localURL}/api/follower`;

export default async function getAllShopFollowers(shopId: string): Promise<Follower[]>{

    const token = await getToken();

    if(token == null) {
        console.log("PLease login to be able to access this function")
        throw new Error("Cannot get all Followers for this shop")
    }

    const response = await fetch( `${BASE_URL}/shop?shopId=${shopId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        }
    });

    
    const data = await response.json();

    console.log("THis is the response of the followers for this shop " , shopId, " data ", data);


    if(!response.ok){
        throw new Error("This is a backend error getting the response");
    }

    return data;
}