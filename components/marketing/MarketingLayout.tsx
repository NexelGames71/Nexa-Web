import PublicFooter from "./PublicFooter";
import PublicNav from "./PublicNav";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-shell text-ink">
      <PublicNav />
      <main>{children}</main>
      <PublicFooter />
    </div>
  );
}
