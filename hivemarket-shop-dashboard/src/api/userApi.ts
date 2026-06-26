
import { localURL } from "@/localURL";
import { getToken } from "../services/authStorage";
import { Location, UpdateUser, UserStoreData } from "../types/User";

const BASE_URL = `${localURL}/api`;


export interface RegisterRequestComplete {
    email: string;
    role: string | undefined;
    fullName: string;       
    location: string;
    university: string;
    campus  : string;
}





export async function serverRole(role: string, email: string, callback: (data: any) => void): Promise<void> {

    

    const token = await getToken();

    console.log(token, "Token")

    try{
        if (!token) {
            throw new Error("No token found");
            
        }

    const requestBody = {
        role: role,
        email: email
    }

    console.log("This is the role login data " , requestBody);

    const response = await fetch(BASE_URL + "/register/role", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)  
     });

     const serverText = await response.text()

     const text = serverText.replace(/"/g, "");

     console.log("Role update response:", text);

    // const setRole = userStore((state) => state.setRole);

     //setRole(text);

     callback(text);

     if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update role");
     }

    } catch (error) {
        console.error("Error updating role:", error);
        throw error;
    }
    
}

export async function serverGender(gender: string, email: string, callback: (data: any) => void): Promise<void> {

    const token = await getToken();

    if(token == null){
        alert("Please login to access this page");
    }

    const requestBody = {
        gender: gender,
        email: email
    }

    try{
        const response = await fetch(BASE_URL + "/register/gender" , {
                method: "POST",
                headers: {
                    "Content-Type" : "application/json",
                    "Authorization" : `Bearer ${token}`
                },
                body: JSON.stringify(requestBody)
        });

        const serverText = await response.text();

        const text = serverText.replace(/"/g,"" )

        callback(text);
        console.log("This is the server Response of Gender", text);

    } catch(error){
        console.error("Cannot connect to gender server", error);
    }
   
}


export async function registerUserApa(data: RegisterRequestComplete): Promise<void> {

    const requestBody = {
        email: data.email,
        role: data.role,
        fullName: data.fullName,
        location: data.location,
        university: data.university,
        campus: data.campus,
    }

    const response = await fetch(BASE_URL + "/register", {
        
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),

    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to register user");
    }
}




export async function uploadProfilePicture(
    email: string, 
    image: string,
    location: Location,
    university: string,
    campus: string

): Promise<void> {

    const token = await getToken();

    if(token == null){
        alert("Please login to access this page");
    }

    const fileName = image.split("/").pop() || `${email}.jpg`
    const ext = fileName.split(".").pop()?.toLowerCase() || "jpg";

    console.log(fileName + ext, "Yeah");

    const formData = new FormData();

    
    formData.append("profilePictures", {
        uri: image,
        name: fileName,
        type: "image/jpeg"
    } as any);

    formData.append("email", email);
    formData.append("address", location.address);
    formData.append("latitude", String(location.latitude));
    formData.append("longitude", String(location.longitude));
    formData.append("university", university);    
    formData.append("campus", campus)

    try {
        const response = await fetch(BASE_URL + "/register/profile-picture", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
        })

    const responseText = await response.text();
    console.log("This is the response", responseText);

    } catch(error) {
        console.log("Error Uploading profilePicture", error)
    }
    
}


export async function getUserData(email: string, callback: (data: UserStoreData) => void) {
    if (!email) throw new Error("Email is required");

    const token = await getToken();
    if (!token) throw new Error("No token found");

    try {
        const response = await fetch(`${BASE_URL}/user-data?email=${email}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch user data");
        }

        const data = await response.json();

        callback(data);

        console.log("User Data:", data);

        return data; // ✅ IMPORTANT
    } catch (error) {
        console.error("Cannot connect to the server:", error);
        throw error;
    }
}

export async function updateUserDetail (data: UpdateUser){

    try {

        const token = await getToken();

        if(token == null) {
            console.log("Please login to be able to access this api call")
            throw new Error("Login required");
        }


        uploadProfilePicture(data.email,data.profile_picture, data.location, data.university, data.campus);

        const dataToBeUpdated = {
            userId: data.id,
            email: data.email,
            location: data.location,
            university: data.university,
            campus: data.campus,
            full_name: data.full_name
        }
        const response = await fetch(`${BASE_URL}/update/profile`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                 "Content-Type": "application/json"
            }, 
            body: JSON.stringify(dataToBeUpdated)
        })

        const result = await response.json();

        console.log("This is the updated output", result);

        return result;

    } catch(e) {
        console.log(e);
        console.log("Cannot find or connect to the route update user Info")
    }

}