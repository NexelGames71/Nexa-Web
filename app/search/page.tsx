import AppProductPage from "../../components/marketing/AppProductPage";
import { APP_PRODUCT_PAGES } from "../../lib/site-content";

export default function SearchPage() {
  const page = APP_PRODUCT_PAGES.search;
  return <AppProductPage {...page} />;
}
