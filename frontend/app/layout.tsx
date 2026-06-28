import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TravelNett - Software para Turismo",
  description: "TravelNett, plataforma de gestión de turismo",

  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${montserrat.className} fondo text-primary antialiased min-h-screen flex flex-col`}>
        <AuthProvider>
          <Toaster toastOptions={{
            success: {
              style: {
                background: '#0546F7',
                color: "white",
              },
            },
            iconTheme: {
              primary: "white",
              secondary: "black",
            },
            error: {
              style: {
                background: 'red',
                color: "white",
              },
            },
          }} />
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
