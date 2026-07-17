import { redirect } from "next/navigation";

export default function ForgotPasswordPage() {
  redirect("/api/auth/start?mode=forgot-password");
}
