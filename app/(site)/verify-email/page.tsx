import { redirect } from "next/navigation";

export default function VerifyEmailPage() {
  redirect("/api/auth/start?mode=login");
}
