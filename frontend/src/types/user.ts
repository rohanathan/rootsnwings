/*
================================================================================
File: src/types/user.ts (Update this file)
================================================================================
Let's use the final, detailed User schema we agreed upon.
*/
import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  phoneNumber: string | null;
  roles: ('mentee' | 'mentor' | 'admin')[];
  authProvider: "email" | "google" | "facebook" | "apple";
  createdAt: Timestamp;
  bio: string | null;
  location: {
    city: string | null;
    postcode: string | null;
    country: string | null;
  };
  skills: string[];
  interests: string[];
  mentorProfile?: {
    status: "pending" | "approved" | "rejected";
    headline: string;
    rate: number;
    totalReviews: number;
    averageRating: number;
  };
}