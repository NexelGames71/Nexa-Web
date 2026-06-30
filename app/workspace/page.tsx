import AppProductPage from "../../components/marketing/AppProductPage";
import { APP_PRODUCT_PAGES } from "../../lib/site-content";

export default function WorkspacePage() {
  const page = APP_PRODUCT_PAGES.workspace;
  return <AppProductPage {...page} />;
}
