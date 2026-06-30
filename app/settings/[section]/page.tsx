import NexaWorkspace from "../../../components/app/NexaWorkspace";

const VALID_SECTIONS = new Set([
  "profile",
  "billing",
  "security",
  "integrations",
  "memory",
  "data",
]);

export default function SettingsSectionPage({ params }: { params: { section: string } }) {
  const section = VALID_SECTIONS.has(params.section) ? params.section : "profile";
  return <NexaWorkspace routeMode="settings" settingsSection={section} />;
}
