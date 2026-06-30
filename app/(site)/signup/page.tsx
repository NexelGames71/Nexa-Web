import AuthForm from "../../../components/marketing/AuthForm";

export default function SignupPage() {
  return (
    <AuthForm
      mode="register"
      title="Create your account"
      subtitle="Start chatting with Nexa in minutes."
      alternateHref="/login"
      alternateLabel="Already have an account? Sign in"
    />
  );
}
