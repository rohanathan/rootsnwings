/*
================================================================================
File: src/components/ThemeRegistry.tsx (Create this file)
================================================================================
This is a crucial helper component that sets up Material-UI's theme and
ensures styles work correctly with Next.js Server-Side Rendering.
*/
'use client';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

// Define your custom theme for Material-UI components with the new blue palette
const theme = createTheme({
    palette: {
        primary: {
            main: '#1d4ed8', // A rich, professional blue (matches Tailwind's blue-700)
        },
        secondary: {
            main: '#60a5fa', // A lighter, friendly blue for accents (Tailwind's blue-400)
        },
        background: {
            default: '#f8fafc', // A very light, clean gray (Tailwind's slate-50)
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h4: {
            fontWeight: 700,
        },
    },
    components: {
        // Example of default component styling
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    textTransform: 'none', // Buttons will use normal case, not UPPERCASE
                    boxShadow: 'none',
                },
                containedPrimary: {
                    '&:hover': {
                        backgroundColor: '#1e40af', // A slightly darker blue for hover
                    }
                }
            }
        }
    }
});

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider theme={theme}>
            {/* CssBaseline kickstarts an elegant, consistent, and simple baseline to build upon. */}
            <CssBaseline />
            {children}
        </ThemeProvider>
    );
}
