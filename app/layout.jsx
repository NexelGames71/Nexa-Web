import "./globals.css";
import Providers from "./providers";

export const metadata = {
  metadataBase: new URL("https://trynexa-ai.com"),
  title: {
    default: "Nexa AI - Intelligent AI Assistant and Browser",
    template: "%s | Nexa AI",
  },
  description:
    "Nexa AI is an intelligent assistant and AI-powered browser built for conversations, research, productivity, automation, and web assistance.",
  keywords: [
    "Nexa AI",
    "AI assistant",
    "AI browser",
    "artificial intelligence",
    "AI chatbot",
    "browser automation",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Nexa AI - Intelligent AI Assistant and Browser",
    description:
      "Use Nexa AI for conversations, research, productivity, automation, and intelligent browsing.",
    url: "https://trynexa-ai.com",
    siteName: "Nexa AI",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico?v=2", sizes: "any" },
      { url: "/icon.png?v=2", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png?v=2", type: "image/png", sizes: "180x180" }],
    shortcut: "/favicon.ico?v=2",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
