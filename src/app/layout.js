import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import AuthProvider from "@/components/layout/AuthProvider";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "BuildTrack ERP | Seven Directions Construction",
  description: "Professional ERP system for construction project management, workforce tracking, and financial oversight.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="h-screen flex overflow-hidden" suppressHydrationWarning>
        <ThemeProvider>
          <Toaster 
            position="top-right" 
            toastOptions={{
              style: {
                background: "var(--card)",
                color: "var(--foreground)",
                border: "1px border var(--border)",
                fontSize: "12px",
                borderRadius: "12px",
              }
            }} 
          />
          <AuthProvider>
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <TopBar />
              <main className="flex-1 overflow-y-auto bg-background">
                {children}
              </main>
              <footer className="shrink-0 h-7 flex items-center justify-center border-t border-border/60 bg-background/80 backdrop-blur-sm">
                <p className="text-[10px] font-semibold text-muted-foreground/60 tracking-widest uppercase select-none">
                  Built by <span className="text-primary/70">Faiq Wajahat</span>
                </p>
              </footer>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

