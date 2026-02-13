import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Image Processor - Remove Background & Flip",
  description:
    "Upload images, remove backgrounds, and flip them horizontally with ease.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
          <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <div className="container mx-auto px-4 py-6 max-w-4xl">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                Image Processor
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Remove backgrounds and flip images
              </p>
            </div>
          </header>

          <main className="container mx-auto px-4 py-8 max-w-4xl">
            {children}
          </main>

          <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-auto">
            <div className="container mx-auto px-4 py-6 max-w-4xl">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Built with Next.js & Tailwind CSS
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
