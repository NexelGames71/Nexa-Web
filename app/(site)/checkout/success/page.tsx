import CheckoutSuccessPanel from "../../../../components/billing/CheckoutSuccessPanel";

type CheckoutSuccessPageProps = {
  searchParams?: {
    plan?: string;
    subscription?: string;
  };
};

export default function CheckoutSuccessPage({ searchParams }: CheckoutSuccessPageProps) {
  return (
    <CheckoutSuccessPanel
      planKey={searchParams?.plan || "plus"}
      subscriptionId={searchParams?.subscription || ""}
    />
  );
}
