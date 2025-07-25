/*
================================================================================
File: src/components/HeroSection.tsx (Update this file)
================================================================================
This is a major overhaul inspired by your reference sites. It now includes a
real search bar and category chips.
*/
'use client';

import React from 'react';
import { Button, Typography, TextField, Box, Chip, Paper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useRouter } from 'next/navigation';

const popularSubjects = ['Python', 'Graphic Design', 'Public Speaking', 'Data Science', 'React'];

export default function HeroSection() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = React.useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/mentors?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };
    
    const handleChipClick = (subject: string) => {
        router.push(`/mentors?search=${encodeURIComponent(subject)}`);
    };

  return (
    <Box className="text-center py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <Typography variant="h2" component="h1" className="font-extrabold text-gray-900">
        Find the perfect mentor
      </Typography>
      <Typography variant="h6" component="p" className="mt-4 text-gray-600 max-w-2xl mx-auto">
        Learn, Grow, Soar with Roots & Wings. Connect with top mentors in any field to accelerate your learning journey.
      </Typography>
      
      {/* Search Bar */}
      <Paper 
        component="form" 
        onSubmit={handleSearch}
        elevation={3}
        className="mt-8 max-w-xl mx-auto flex items-center p-2 rounded-full"
      >
        <TextField
          fullWidth
          variant="standard"
          placeholder="Try 'JavaScript' or 'Project Management'"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            disableUnderline: true,
            startAdornment: <SearchIcon sx={{ color: 'text.disabled', mr: 1 }} />,
          }}
          className="px-4"
        />
        <Button type="submit" variant="contained" color="primary" className="rounded-full" sx={{py: 1.5, px: 4}}>
          Search
        </Button>
      </Paper>

      {/* Popular Subjects */}
      <Box className="mt-6 flex justify-center flex-wrap gap-2">
        {popularSubjects.map((subject) => (
            <Chip 
                key={subject} 
                label={subject} 
                variant="outlined" 
                onClick={() => handleChipClick(subject)} 
                sx={{ cursor: 'pointer' }}
            />
        ))}
      </Box>
    </Box>
  );
}