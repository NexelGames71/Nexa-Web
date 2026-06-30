import AppProductPage from "../../components/marketing/AppProductPage";
import { APP_PRODUCT_PAGES } from "../../lib/site-content";

export default function LibraryPage() {
  const page = APP_PRODUCT_PAGES.library;
  return <AppProductPage {...page} />;
}
