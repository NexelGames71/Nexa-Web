import AppProductPage from "../../components/marketing/AppProductPage";
import { APP_PRODUCT_PAGES } from "../../lib/site-content";

export default function TasksPage() {
  const page = APP_PRODUCT_PAGES.tasks;
  return <AppProductPage {...page} />;
}
