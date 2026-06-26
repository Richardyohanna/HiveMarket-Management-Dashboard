import { create } from "zustand";
import { Location, User, UserStoreData } from "../types/User";

const initialState: User = {
    id: "",
    full_name: "",
    email: "",
    role: "",
    gender: "",
    profile_picture: "",
    university: "",
    location: {
        address: "",
        latitude: 0,
        longitude: 0
    },
    campus: "",
    isSeller: false,
    walletBalance: 0,
    totalEarned: 0,
}
export const userStore = create<UserStoreData>((set, get) => ({
    ...initialState,

    setUserId: (value: string) => set({id: value}),
    setFullName: (value: string) => set({full_name: value}),
    setEmail: (value: string) => set({email: value}),
    setRole: (value: string) => set({role: value}),
    setGender: (value: string) => set({gender: value}),
    setProfilePicture: (value: string) => set({profile_picture: value}),
    setUniversity: (value: string) => set({university: value}),
    setLocation: (value: Location) => set({location: value}),
    setCampus: (value: string) => set({campus: value}),
    setIsSeller: (value: boolean) => set({isSeller: value}),
    setWalletBalance: (value: number) => set({walletBalance: value}),
    setTotalEarned: (value: number) => set({totalEarned: value}),

     clearUser: () => set({ ...initialState }),
}))