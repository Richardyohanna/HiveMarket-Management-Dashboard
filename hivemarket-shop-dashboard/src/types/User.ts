


export type User = {

    id: string;
    full_name: string;
    email: string;
    role?: string;
    gender: string;
    profile_picture: string;
    university: string;
    location: Location;
    campus: string;
    isSeller?: boolean;
    walletBalance?: number;
    totalEarned?: number;
}

export type Location = {
    address: string;
    latitude: number;
    longitude: number;
}

export type UpdateUser = {
    id: string;
    email: string;
    full_name: string;
    profile_picture: string;
    university: string;
    location: Location;
    campus: string;
}

export type UserStoreData = {

    id: string;
    full_name: string;
    email: string;
    role?: string;
    gender: string;
    profile_picture: string ;
    university: string;
    location: Location;
    campus: string;
    isSeller?: boolean;
    walletBalance?: number;
    totalEarned?: number;

    // setters
    setUserId: (value: string) => void;
    setFullName: (value: string) => void;
    setEmail: (value: string) => void;
    setRole: (value: string) => void;
    setGender: (value: string) => void;
    setProfilePicture: (value: string) => void;
    setUniversity: (value: string) => void;
    setLocation: (value: Location) => void;
    setCampus: (value: string) => void;
    setIsSeller: (value: boolean) => void;
    setWalletBalance: (value: number) => void;
    setTotalEarned: (value: number) => void;

    clearUser: () => void;
}