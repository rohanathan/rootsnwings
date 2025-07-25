/*
================================================================================
File: src/components/MentorCard.tsx (Update this file)
================================================================================
This update polishes the MentorCard UI significantly. It adds a rating,
improves the layout, and provides a much better fallback for missing images.
*/
import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardMedia, Typography, Box, Chip, Rating } from '@mui/material';
import { User } from '@/types/user';

interface MentorCardProps {
  user: User;
}

// Function to generate a consistent, nice-looking avatar fallback
const getAvatarUrl = (name: string) => {
    return `https://avatar.vercel.app/${encodeURIComponent(name)}.svg?text=${name.substring(0,2)}`;
}

export default function MentorCard({ user }: MentorCardProps) {
  const headline = user.mentorProfile?.headline || 'Mentor';
  const skills = user.skills || [];
  const rating = user.mentorProfile?.averageRating || 0;
  const reviewCount = user.mentorProfile?.totalReviews || 0;
  // Use the generated avatar as a fallback if photoURL is missing
  const photo = user.photoURL || getAvatarUrl(user.displayName);

  return (
    <Link href={`/mentors/${user.uid}`} passHref>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 4, transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 }, cursor: 'pointer' }}>
        <CardMedia
          component="img"
          height="220"
          image={photo}
          alt={user.displayName}
          sx={{ objectFit: 'cover' }}
        />
        <CardContent sx={{ flexGrow: 1, p: 2 }}>
          <Typography gutterBottom variant="h6" component="div" className="font-bold">
            {user.displayName}
          </Typography>
          <Typography variant="body2" color="primary.main" className="font-semibold mb-2">
            {headline}
          </Typography>
          
          {rating > 0 && (
            <Box className="flex items-center mb-2">
                <Rating name="read-only" value={rating} precision={0.5} readOnly size="small"/>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    ({reviewCount} reviews)
                </Typography>
            </Box>
          )}

          <Typography variant="body2" color="text.secondary" className="mb-3 line-clamp-2">
            {user.bio}
          </Typography>
          
          <Box>
            {skills.slice(0, 3).map((skill) => (
              <Chip key={skill} label={skill} sx={{ mr: 1, mb: 1 }} size="small" />
            ))}
          </Box>
        </CardContent>
      </Card>
    </Link>
  );
}