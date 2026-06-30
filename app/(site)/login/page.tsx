import AuthForm from "../../../components/marketing/AuthForm";

export default function LoginPage() {
  return (
    <AuthForm
      mode="login"
      title="Welcome back"
      subtitle="Sign in to access your Nexa workspace."
      alternateHref="/signup"
      alternateLabel="Need an account? Sign up"
    />
  );
}
