import Link from "next/link";
import type { Metadata } from "next";

import Section from "../../../components/marketing/Section";
import { BLOG_POSTS } from "../../../lib/site-content";

export const metadata: Metadata = {
  title: "Nexa Blog",
  description:
    "Read Nexa AI product updates, model release notes, runtime progress, image generation updates, browser direction, and company engineering notes.",
  alternates: {
    canonical: "/blog",
  },
};

export default function BlogPage() {
  const featured = BLOG_POSTS[0];
  const remaining = BLOG_POSTS.slice(1);

  return (
    <>
      <section className="border-b border-line bg-[#050505] px-5 py-14 text-white md:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="inline-flex rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/64">
            Nexa Labs updates
          </p>
          <h1 className="mt-8 max-w-4xl text-5xl font-semibold tracking-tight md:text-7xl">
            Product notes for Nexa AI, Ember, Prism, and the private runtime.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">
            Follow the model family, assistant workspace, image system, browser direction, and infrastructure work behind Nexa.
          </p>
        </div>
      </section>

      {featured ? (
        <Section title="Featured update" subtitle="The latest product story from Nexa Labs.">
          <Link
            href={`/blog/${featured.slug}`}
            className="block rounded-[32px] border border-line bg-panel p-8 shadow-soft transition hover:-translate-y-1 hover:border-ink/30"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">{featured.category}</span>
              <span className="text-xs text-muted">{featured.date}</span>
            </div>
            <h2 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight text-ink">{featured.title}</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">{featured.excerpt}</p>
            <span className="mt-6 inline-flex text-sm font-semibold text-ink underline underline-offset-4">
              Read update -&gt;
            </span>
          </Link>
        </Section>
      ) : null}

      <Section title="All posts" subtitle="Model releases, runtime updates, product design notes, and roadmap direction." className="bg-shell">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {remaining.map((post) => (
            <article key={post.slug} className="rounded-3xl border border-line bg-panel p-6 shadow-soft">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-shell px-3 py-1 text-xs font-medium text-muted">{post.category}</span>
                <span className="text-xs text-muted">{post.date}</span>
              </div>
              <h3 className="mt-4 text-xl font-semibold tracking-tight text-ink">{post.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{post.excerpt}</p>
              <Link href={`/blog/${post.slug}`} className="mt-5 inline-flex text-sm font-semibold text-ink underline underline-offset-4">
                Read more -&gt;
              </Link>
            </article>
          ))}
        </div>
      </Section>
    </>
  );
}
