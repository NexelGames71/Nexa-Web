import { redirect } from "next/navigation";

export default function LoginPage({ searchParams }: { searchParams?: { next?: string; return_to?: string } }) {
  const params = new URLSearchParams({ mode: "login" });
  const next = searchParams?.next || searchParams?.return_to;
  if (next) {
    params.set("next", next);
  }
  redirect(`/api/auth/start?${params.toString()}`);
}
