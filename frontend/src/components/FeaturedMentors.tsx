/*
================================================================================
File: src/components/FeaturedMentors.tsx (Update this file)
================================================================================
This is the main change. We are converting this into an async Server Component
that fetches data directly from Firestore.
*/
import React from 'react';
import { Typography, Grid } from '@mui/material';
import MentorCard from './MentorCard';
import { User } from '@/types/user'; // Use our detailed User type
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// This is now an async function, which makes it a React Server Component
async function getFeaturedMentors(): Promise<User[]> {
  try {
    // Create a query to get users who are approved mentors
    const mentorsQuery = query(
      collection(db, 'users'),
      where('roles', 'array-contains', 'mentor'),
      where('mentorProfile.status', '==', 'approved'),
      limit(6) // Let's feature up to 6 mentors on the home page
    );

    const querySnapshot = await getDocs(mentorsQuery);
    
    const mentors = querySnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
    })) as User[];
    
    return mentors;
  } catch (error) {
    console.error("Error fetching featured mentors:", error);
    return []; // Return an empty array on error
  }
}

export default async function FeaturedMentors() {
  // We call our async function to get the data
  const mentors = await getFeaturedMentors();

  return (
    <div className="container mx-auto px-4 py-16">
      <Typography variant="h4" component="h2" className="text-center font-bold mb-10">
        Meet Our Mentors
      </Typography>
      {mentors.length > 0 ? (
        <Grid container spacing={4}>
          {mentors.map((mentor) => (
            <Grid item key={mentor.uid} xs={12} sm={6} md={4}>
              <MentorCard user={mentor} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography className="text-center text-gray-500">
          No mentors are available at the moment. Please check back later!
        </Typography>
      )}
    </div>
  );
}
