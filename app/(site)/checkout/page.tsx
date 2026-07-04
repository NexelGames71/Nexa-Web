import CheckoutPanel from "../../../components/billing/CheckoutPanel";

type CheckoutPageProps = {
  searchParams?: {
    plan?: string;
  };
};

export default function CheckoutPage({ searchParams }: CheckoutPageProps) {
  return <CheckoutPanel planKey={searchParams?.plan || "plus"} />;
}
