"use client";

import { AuthProvider } from "../components/providers/AuthProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
