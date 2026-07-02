
export interface Follower {
  id: string;
  name: string;
  avatarUrl: string | null;
  university: string;
  state: string;        // e.g. "FCT", "Lagos"
  city: string;         // e.g. "Abuja", "Surulere"
  coordinates: { lat: number; lng: number };
  followedAt: string;   // ISO
  isActive: boolean;    // online recently
}