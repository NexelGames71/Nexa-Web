import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import emberModelArt from "../../../../assets/Ember 0.5.png";
import { BLOG_POSTS } from "../../../../lib/site-content";

type BlogPost = (typeof BLOG_POSTS)[number];

function findPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((item) => item.slug === slug);
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = findPost(params.slug);
  if (!post) {
    return {
      title: "Blog Post",
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = findPost(params.slug);
  if (!post) {
    notFound();
  }
  const showEmberHero = post.slug === "introducing-ember-0-5";

  return (
    <article>
      <header className="overflow-hidden border-b border-line bg-[#050505] px-5 py-14 text-white md:py-20">
        <div className={`mx-auto grid max-w-6xl gap-10 ${showEmberHero ? "lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1fr)] lg:items-center" : ""}`}>
          <div className={showEmberHero ? "" : "mx-auto max-w-3xl"}>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/70">
                {post.category}
              </span>
              <span className="text-xs text-white/50">{post.date}</span>
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-6xl">{post.title}</h1>
            <p className="mt-5 text-lg leading-8 text-white/70">{post.excerpt}</p>
          </div>

          {showEmberHero ? (
            <div className="relative">
              <div className="absolute -inset-8 rounded-[40px] bg-orange-500/10 blur-3xl" aria-hidden />
              <Image
                src={emberModelArt}
                alt="Ember 0.5, Nexa's first official text model"
                priority
                className="relative rounded-[28px] border border-white/10 shadow-[0_32px_120px_rgba(255,98,0,0.25)]"
              />
            </div>
          ) : null}
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-14">
        <div className="space-y-10">
          {post.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-2xl font-semibold tracking-tight text-ink">{section.title}</h2>
              <p className="mt-4 text-base leading-8 text-muted">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-14 rounded-3xl border border-line bg-panel p-6 shadow-soft">
          <h2 className="text-xl font-semibold text-ink">Keep exploring Nexa</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Review the model family, open the assistant, or browse the full feature stack.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/models" className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white">
              View models
            </Link>
            <Link href="/features" className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink">
              View features
            </Link>
            <Link href="/chat" className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink">
              Open chat
            </Link>
          </div>
        </div>

        <Link href="/blog" className="mt-10 inline-flex text-sm font-semibold text-ink underline underline-offset-4">
          &lt;- Back to blog
        </Link>
      </div>
    </article>
  );
}
