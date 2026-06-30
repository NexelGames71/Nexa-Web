import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Nexa AI — Chat, Memory, Agents & API",
  description:
    "Nexa AI platform: ChatGPT-style chat, memory, search, custom assistants, developer API, and enterprise options.",
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

