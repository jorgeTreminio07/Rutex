import type { Metadata, Viewport } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { AppProviders } from "@/providers/app-providers";
import { getPublicStoreIdentity } from "@/lib/server/store-identity";

export async function generateMetadata(): Promise<Metadata> {
  const { name, logoUrl } = await getPublicStoreIdentity();
  return {
    title: name,
    description: `Gestión de ${name}`,
    icons: {
      icon: logoUrl ?? "/favicon.svg",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0f172a",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}