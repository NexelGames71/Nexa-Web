import Link from "next/link";
import { BRAND, FOOTER_GROUPS } from "../../lib/site-content";

export default function PublicFooter() {
  return (
    <footer className="border-t border-line bg-panel">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-5">
        <div className="md:col-span-2">
          <p className="text-lg font-semibold text-ink">{BRAND.name}</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted">{BRAND.tagline}</p>
        </div>
        {FOOTER_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="text-sm font-semibold text-ink">{group.title}</p>
            <ul className="mt-4 space-y-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted transition hover:text-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line px-5 py-6 text-center text-xs text-muted">
        © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
      </div>
    </footer>
  );
}
