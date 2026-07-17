import { redirect } from "next/navigation";

export default function LegacyAuthPage() {
  redirect("/api/auth/start?mode=login");
}
