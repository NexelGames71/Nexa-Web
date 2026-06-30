import Link from "next/link";
import PageHero from "../../../components/marketing/PageHero";
import Section from "../../../components/marketing/Section";
import { BLOG_POSTS } from "../../../lib/site-content";

export default function BlogPage() {
  return (
    <>
      <PageHero eyebrow="Blog" title="Announcements & updates" subtitle="Product news from the Nexa team." />
      <Section title="Latest posts">
        <div className="space-y-4">
          {BLOG_POSTS.map((post) => (
            <article key={post.slug} className="rounded-3xl border border-line bg-panel p-6 shadow-soft">
              <p className="text-xs text-muted">{post.date}</p>
              <h3 className="mt-2 text-lg font-semibold">{post.title}</h3>
              <p className="mt-2 text-sm text-muted">{post.excerpt}</p>
              <Link href={`/blog/${post.slug}`} className="mt-4 inline-block text-sm font-medium underline underline-offset-4">
                Read more →
              </Link>
            </article>
          ))}
        </div>
      </Section>
    </>
  );
}
