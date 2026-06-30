import AppProductPage from "../../components/marketing/AppProductPage";
import { APP_PRODUCT_PAGES } from "../../lib/site-content";

export default function VoicePage() {
  const page = APP_PRODUCT_PAGES.voice;
  return <AppProductPage {...page} />;
}
