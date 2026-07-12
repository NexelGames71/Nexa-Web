import { notFound } from "next/navigation";
import AdminShell from "../../components/admin/AdminShell";
import { isAdminRouteEnabled } from "../../lib/server/admin-route-access";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isAdminRouteEnabled()) {
    notFound();
  }

  return <AdminShell>{children}</AdminShell>;
}
