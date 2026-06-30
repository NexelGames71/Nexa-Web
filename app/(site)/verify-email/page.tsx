import Link from "next/link";
import PageHero from "../../../components/marketing/PageHero";

export default function VerifyEmailPage() {
  return (
    <>
      <PageHero
        title="Verify your email"
        subtitle="Check your inbox for a verification link. Appwrite verification can be enabled in your project settings."
      />
      <p className="pb-20 text-center text-sm text-muted">
        <Link href="/chat" className="underline underline-offset-4">
          Continue to chat
        </Link>
      </p>
    </>
  );
}
