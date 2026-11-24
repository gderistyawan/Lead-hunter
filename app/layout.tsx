import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lead Hunter AI · Sales Intelligence",
  description: "Discover your next best customer with Lead Hunter AI."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
