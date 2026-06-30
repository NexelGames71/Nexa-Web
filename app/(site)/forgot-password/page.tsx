import Link from "next/link";
import PageHero from "../../../components/marketing/PageHero";

export default function ForgotPasswordPage() {
  return (
    <>
      <PageHero
        title="Reset your password"
        subtitle="Enter your email and we'll send reset instructions when email delivery is enabled."
      />
      <section className="px-5 pb-20">
        <form className="mx-auto flex max-w-md flex-col gap-4 rounded-3xl border border-line bg-panel p-8 shadow-soft">
          <input
            type="email"
            placeholder="Email"
            className="rounded-2xl border border-line px-4 py-3 text-sm outline-none"
            required
          />
          <button type="submit" className="rounded-2xl bg-ink py-3 text-sm font-medium text-white">
            Send reset link (demo)
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/login" className="underline underline-offset-4">
            Back to login
          </Link>
        </p>
      </section>
    </>
  );
}
