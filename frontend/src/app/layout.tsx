/*
================================================================================
File: src/app/layout.tsx (Update this file)
================================================================================
This update standardizes the header and adds a new, comprehensive footer.
*/
import type { Metadata } from "next";
import Link from 'next/link';
import { Box, Container, Grid, Typography } from '@mui/material';
import ThemeRegistry from '@/components/ThemeRegistry';
import { AuthProvider } from '@/context/AuthContext';
import AuthNav from "@/components/AuthNav";

export const metadata: Metadata = {
  title: "Roots & Wings",
  description: "Mentorship Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <AuthProvider>
            <div className="min-h-screen flex flex-col bg-slate-50">
              <header className="bg-white text-gray-800 p-4 shadow-sm sticky top-0 z-50 border-b border-gray-200">
                <nav className="container mx-auto flex items-center gap-6">
                  <Link href="/" className="font-bold text-xl text-blue-700">
                    Roots & Wings
                  </Link>
                  <div className="flex-grow"></div>
                  <Link href="/mentors" className="font-medium text-gray-600 hover:text-blue-700">Find a Mentor</Link>
                  <Link href="/workshops" className="font-medium text-gray-600 hover:text-blue-700">Workshops</Link>
                  <AuthNav />
                </nav>
              </header>

              <main className="flex-grow">
                {children}
              </main>

              {/* NEW COMPREHENSIVE FOOTER */}
              <footer className="bg-gray-800 text-white mt-16">
                <Container maxWidth="lg" className="py-12">
                  <Grid container spacing={4}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="h6" gutterBottom>Roots & Wings</Typography>
                      <Typography variant="body2" color="gray.400">
                        Our mission is to connect learners with experienced mentors to foster growth and unlock potential.
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={4} md={2}>
                      <Typography variant="subtitle1" gutterBottom>Platform</Typography>
                      <Link href="/mentors" passHref><Typography className="hover:underline py-1" color="gray.300">Find a Mentor</Typography></Link>
                      <Link href="/workshops" passHref><Typography className="hover:underline py-1" color="gray.300">Workshops</Typography></Link>
                      <Link href="/about" passHref><Typography className="hover:underline py-1" color="gray.300">About Us</Typography></Link>
                    </Grid>
                    <Grid item xs={6} sm={4} md={2}>
                      <Typography variant="subtitle1" gutterBottom>Support</Typography>
                      <Link href="/faq" passHref><Typography className="hover:underline py-1" color="gray.300">FAQ</Typography></Link>
                      <Link href="/contact" passHref><Typography className="hover:underline py-1" color="gray.300">Contact</Typography></Link>
                    </Grid>
                     <Grid item xs={6} sm={4} md={2}>
                      <Typography variant="subtitle1" gutterBottom>Legal</Typography>
                      <Link href="/privacy" passHref><Typography className="hover:underline py-1" color="gray.300">Privacy Policy</Typography></Link>
                      <Link href="/terms" passHref><Typography className="hover:underline py-1" color="gray.300">Terms of Service</Typography></Link>
                    </Grid>
                  </Grid>
                  <Box className="text-center mt-8 border-t border-gray-700 pt-6">
                    <Typography variant="body2" color="gray.500">
                      © {new Date().getFullYear()} Roots & Wings. All rights reserved.
                    </Typography>
                  </Box>
                </Container>
              </footer>
            </div>
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
