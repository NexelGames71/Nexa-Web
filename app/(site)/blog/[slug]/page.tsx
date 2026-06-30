import Link from "next/link";
import { notFound } from "next/navigation";
import { BLOG_POSTS } from "../../../../lib/site-content";

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = BLOG_POSTS.find((item) => item.slug === params.slug);
  if (!post) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl px-5 py-16">
      <p className="text-xs text-muted">{post.date}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{post.title}</h1>
      <p className="mt-6 text-sm leading-7 text-muted">{post.excerpt}</p>
      <p className="mt-6 text-sm leading-7 text-muted">
        Full article content will be published here. For now, explore the{" "}
        <Link href="/features" className="text-ink underline underline-offset-4">
          platform features
        </Link>{" "}
        or open{" "}
        <Link href="/chat" className="text-ink underline underline-offset-4">
          Nexa Chat
        </Link>
        .
      </p>
      <Link href="/blog" className="mt-10 inline-block text-sm underline underline-offset-4">
        ← Back to blog
      </Link>
    </article>
  );
}
