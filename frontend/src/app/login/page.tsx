// src/app/login/page.tsx

'use client'; // This is a client component

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Import from our new file

// MUI Components
import {
    Box,
    Button,
    Container,
    Typography,
    CircularProgress
} from '@mui/material';

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const googleProvider = new GoogleAuthProvider();

    const handleSignIn = async () => {
        setIsLoading(true);
        setError('');
        try {
            await signInWithPopup(auth, googleProvider);
            // After successful sign-in, redirect to the dashboard.
            router.push('/dashboard');
        } catch (error) {
            console.error("Authentication Error:", error);
            setError("Failed to sign in. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    backgroundColor: 'white',
                    padding: 4,
                    borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
            >
                <Typography component="h1" variant="h4" color="primary.main">
                    Roots & Wings
                </Typography>
                <Typography component="p" sx={{ mt: 1, mb: 3 }}>
                    Find your mentor, grow your wings.
                </Typography>

                {isLoading ? (
                    <CircularProgress />
                ) : (
                    <Button
                        type="button"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2, py: 1.5 }}
                        onClick={handleSignIn}
                    >
                        Sign In with Google
                    </Button>
                )}
                {error && (
                    <Typography color="error" sx={{ mt: 2 }}>
                        {error}
                    </Typography>
                )}
            </Box>
        </Container>
    );
}