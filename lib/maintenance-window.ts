const DEFAULT_MAINTENANCE_UNTIL = "2026-07-22T13:12:16-05:00";

export function getConfiguredMaintenanceUntil() {
  return (
    process.env.NEXA_MAINTENANCE_UNTIL ||
    process.env.NEXT_PUBLIC_NEXA_MAINTENANCE_UNTIL ||
    DEFAULT_MAINTENANCE_UNTIL
  );
}
