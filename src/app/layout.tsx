import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { PasswordResetHandler } from "@/components/password-reset-handler";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Burpp - Services you need, all in one place.",
  description: "Burpp - Services you need, all in one place.. Connect with trusted local professionals for everything from home services to personal training.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Burpp - Services you need, all in one place.",
    description: "Connect with trusted local professionals for everything from home services to personal training.",
    type: "website",
    url: "https://burpp.com",
    siteName: "Burpp",
  },
  twitter: {
    card: "summary_large_image",
    title: "Burpp - Services you need, all in one place.",
    description: "Connect with trusted local professionals for everything from home services to personal training.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} antialiased`} suppressHydrationWarning>
        {/* Immediate password reset redirect - runs before React loads */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (typeof window === 'undefined') return;
                  var currentPath = window.location.pathname;
                  var hash = window.location.hash;

                  // If already on reset-password, we're good
                  if (currentPath === '/reset-password') {
                    return;
                  }
                  
                  // Check for password reset token in hash
                  if (hash) {
                    var hashParams = new URLSearchParams(hash.substring(1));
                    var type = hashParams.get('type');
                    var accessToken = hashParams.get('access_token');

                    // If this is a password reset link, redirect immediately
                    if (type === 'recovery' && accessToken) {
                      window.location.replace('/reset-password' + hash);
                      return; // Stop execution
                    }
                  }
                } catch (e) {
                  // Intentionally swallow to avoid noisy console output
                }
              })();
            `,
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme="light">
          <AuthProvider>
            <PasswordResetHandler />
            {children}
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
