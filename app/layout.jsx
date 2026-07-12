import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Nexa AI — Chat, Memory, Agents & API",
  description:
    "Nexa AI platform: ChatGPT-style chat, memory, search, custom assistants, developer API, and enterprise options.",
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
