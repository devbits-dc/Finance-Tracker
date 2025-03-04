import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ['latiin'] });

export const metadata = {
  title: "Welth",
  description: "One stop Finance Platform",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
    <html lang="en">
      <body className={`${inter.className}`}>
        {/* Header */}
        <Header/>
          <main className="min-h-screen" >{children}</main>
          <Toaster richColors/>
        {/* Footer */}
        <footer className="bg-blue-50 py-12">
          <div className="container mx-auto text-center text-gray-600">
            <p>Made A Footer</p>
          </div>
        </footer>
      </body>
    </html>
    </ClerkProvider>
  );
}
