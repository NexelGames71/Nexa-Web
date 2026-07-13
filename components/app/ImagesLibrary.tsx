"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { account, appwriteConfigured, createSessionJwt } from "../../lib/appwrite";

type GeneratedImage = {
  id: string;
  imageId: string;
  prompt: string;
  revisedPrompt: string;
  model: string;
  provider: string;
  format: string;
  sizeBytes: number;
  width: number;
  height: number;
  seed: number | null;
  status: string;
  url: string;
  conversationId: string;
  createdAt: string;
};

const quickPrompts = [
  "Product concept",
  "Logo system",
  "Interior render",
  "Character sheet",
  "App hero image",
];

function formatDate(value: string) {
  if (!value) return "Unknown date";
  try {
    return new Date(value).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function formatBytes(value: number) {
  if (!value) return "Stored";
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function imageTitle(image: GeneratedImage) {
  const text = image.prompt || image.revisedPrompt || "Generated image";
  return text.replace(/^(create|generate|make|design)\s+/i, "").trim() || "Generated image";
}

export default function ImagesLibrary() {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  const newestImage = images[0] || null;

  const filteredImages = useMemo(() => {
    const term = query.trim().toLowerCase();
    return images.filter((image) => {
      const matchesSearch =
        !term ||
        [image.prompt, image.revisedPrompt, image.model]
          .join(" ")
          .toLowerCase()
          .includes(term);
      return matchesSearch;
    });
  }, [images, query]);

  async function loadImages() {
    setLoading(true);
    setError("");

    try {
      if (!appwriteConfigured) {
        throw new Error("Appwrite is not configured.");
      }

      await account.get();
      const jwt = await createSessionJwt();
      const response = await fetch("/api/images", {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load images.");
      }

      setImages(Array.isArray(data.items) ? data.items : []);
    } catch (loadError: any) {
      setError(loadError?.message || "Failed to load images.");
      setImages([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadImages();
  }, []);

  return (
    <main className="min-h-screen bg-[#07080d] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-20 shrink-0 border-r border-white/10 bg-black/30 px-3 py-5 lg:flex lg:flex-col lg:items-center">
          <Link
            href="/chat"
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-black"
            aria-label="Back to chat"
          >
            N
          </Link>
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/chat"
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-white/60 transition hover:bg-white/10 hover:text-white"
              title="Chat"
            >
              <span className="text-lg">+</span>
            </Link>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 text-white shadow-[0_0_24px_rgba(104,167,255,0.22)]"
              title="Images"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
                <path d="M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z" stroke="currentColor" strokeWidth="1.7" />
                <path d="m4 15 4-4 4 4 2-2 6 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
            <header>
              <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.06] shadow-[0_24px_100px_rgba(0,0,0,0.35)]">
                <div className="relative min-h-[360px] p-5 sm:p-7">
                  {newestImage?.url ? (
                    <img
                      src={newestImage.url}
                      alt={newestImage.prompt || "Latest generated image"}
                      className="absolute inset-0 h-full w-full object-cover opacity-55"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(7,8,13,0.94),rgba(7,8,13,0.58),rgba(7,8,13,0.22))]" />
                  <div className="relative z-10 flex min-h-[320px] flex-col justify-between">
                    <div className="flex items-center justify-between gap-3">
                      <Link href="/chat" className="rounded-full border border-white/12 bg-black/30 px-3 py-1.5 text-sm text-white/72 backdrop-blur transition hover:text-white">
                        Back to chat
                      </Link>
                      <button
                        type="button"
                        onClick={() => void loadImages()}
                        className="rounded-full border border-white/12 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/16"
                      >
                        Refresh
                      </button>
                    </div>

                    <div className="max-w-3xl">
                      <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#8ab4ff]">Nexa image studio</p>
                      <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-normal text-white sm:text-6xl">
                        Your visual work, ready to reuse.
                      </h1>
                      <p className="mt-5 max-w-2xl text-base leading-7 text-white/72">
                        Search, inspect, and reopen every image generated with Nexa. Each result keeps its prompt, source chat, and signed storage link.
                      </p>
                    </div>

                    <form
                      className="mt-8 flex flex-col gap-3 rounded-[28px] border border-white/12 bg-black/45 p-2 shadow-[0_18px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:flex-row sm:items-center"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const prompt = query.trim() || "Create an image of ";
                        window.location.href = `/chat?prompt=${encodeURIComponent(prompt)}&send=1`;
                      }}
                    >
                      <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search images or describe a new image"
                        className="h-12 min-w-0 flex-1 bg-transparent px-4 text-sm text-white outline-none placeholder:text-white/45"
                      />
                      <button
                        type="submit"
                        className="inline-flex h-12 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-black transition hover:bg-[#dce8ff]"
                      >
                        Create
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </header>

            <section className="mt-5 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.045] p-4">
              <div className="flex gap-3 overflow-x-auto pb-1">
                {quickPrompts.map((prompt) => (
                  <Link
                    key={prompt}
                    href={`/chat?prompt=${encodeURIComponent(`Create a ${prompt.toLowerCase()} image`)}&send=1`}
                    className="shrink-0 rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-sm text-white/78 transition hover:bg-white/10 hover:text-white"
                  >
                    {prompt}
                  </Link>
                ))}
              </div>
            </section>

            <section className="mt-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/38">Library</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Generated images</h2>
                </div>
              </div>

              {error ? (
                <div className="mt-5 rounded-3xl border border-red-400/25 bg-red-500/10 px-5 py-4 text-sm text-red-100">
                  {error}
                </div>
              ) : null}

              {loading ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="h-80 animate-pulse rounded-[30px] bg-white/[0.07]" />
                  ))}
                </div>
              ) : filteredImages.length ? (
                <div className="mt-5 columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
                  {filteredImages.map((image, index) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => setSelectedImage(image)}
                      className="group mb-4 block w-full break-inside-avoid overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.06] text-left shadow-[0_18px_70px_rgba(0,0,0,0.22)] transition hover:-translate-y-1 hover:border-white/22 hover:bg-white/[0.09]"
                    >
                      <div className={index % 5 === 1 ? "aspect-[4/5]" : index % 5 === 3 ? "aspect-[16/10]" : "aspect-square"}>
                        {image.url ? (
                          <img
                            src={image.url}
                            alt={image.prompt || "Generated image"}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-white/48">
                            Image URL unavailable
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between gap-3 text-xs text-white/42">
                          <span>{formatDate(image.createdAt)}</span>
                          <span>{formatBytes(image.sizeBytes)}</span>
                        </div>
                        <p className="mt-3 line-clamp-2 text-sm font-medium leading-6 text-white">
                          {imageTitle(image)}
                        </p>
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/62">
                            Nexa image
                          </span>
                          <span className="text-xs font-medium text-[#8ab4ff]">Inspect</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-5 flex min-h-[360px] items-center justify-center rounded-[34px] border border-dashed border-white/12 bg-white/[0.045] px-6 py-20 text-center">
                  <div>
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-white/10 text-2xl">N</div>
                    <h2 className="mt-5 text-2xl font-semibold text-white">No images match this view</h2>
                    <p className="mt-2 max-w-md text-sm leading-6 text-white/55">
                      Generate an image in chat or clear the search and filter controls.
                    </p>
                    <Link
                      href="/chat"
                      className="mt-6 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black"
                    >
                      Create image
                    </Link>
                  </div>
                </div>
              )}
            </section>
          </div>
        </section>
      </div>

      {selectedImage ? (
        <div
          className="fixed inset-0 z-50 bg-black/82 p-3 backdrop-blur-xl sm:p-5"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="mx-auto grid h-full max-w-7xl overflow-hidden rounded-[34px] border border-white/12 bg-[#0b0d14] shadow-2xl lg:grid-cols-[minmax(0,1fr)_420px]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative min-h-0 bg-black">
              {selectedImage.url ? (
                <img
                  src={selectedImage.url}
                  alt={selectedImage.prompt || "Generated image"}
                  className="h-full w-full object-contain"
                />
              ) : null}
            </div>
            <aside className="overflow-y-auto border-l border-white/10 p-5 text-white">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ab4ff]">Image record</p>
                  <h2 className="mt-2 text-2xl font-semibold">{imageTitle(selectedImage)}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/62 transition hover:bg-white/10 hover:text-white"
                >
                  Close
                </button>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-3xl bg-white/[0.06] p-4">
                  <div className="text-xs uppercase tracking-[0.14em] text-white/38">Created</div>
                  <div className="mt-2 text-sm font-medium">{formatDate(selectedImage.createdAt)}</div>
                </div>
                <div className="rounded-3xl bg-white/[0.06] p-4">
                  <div className="text-xs uppercase tracking-[0.14em] text-white/38">Size</div>
                  <div className="mt-2 text-sm font-medium">{formatBytes(selectedImage.sizeBytes)}</div>
                </div>
                <div className="rounded-3xl bg-white/[0.06] p-4">
                  <div className="text-xs uppercase tracking-[0.14em] text-white/38">Model</div>
                  <div className="mt-2 text-sm font-medium">Nexa image</div>
                </div>
              </div>

              <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.045] p-4">
                <h3 className="font-semibold">Prompt</h3>
                <p className="mt-3 text-sm leading-6 text-white/65">{selectedImage.prompt || "No prompt stored."}</p>
              </section>

              {selectedImage.revisedPrompt && selectedImage.revisedPrompt !== selectedImage.prompt ? (
                <section className="mt-4 rounded-3xl border border-white/10 bg-white/[0.045] p-4">
                  <h3 className="font-semibold">Revised prompt</h3>
                  <p className="mt-3 text-sm leading-6 text-white/65">{selectedImage.revisedPrompt}</p>
                </section>
              ) : null}

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {selectedImage.url ? (
                  <a
                    href={selectedImage.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-black transition hover:bg-[#dce8ff]"
                  >
                    Open full image
                  </a>
                ) : null}
                {selectedImage.conversationId ? (
                  <Link
                    href={`/chat?chat=${selectedImage.conversationId}`}
                    className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Continue in chat
                  </Link>
                ) : null}
              </div>
            </aside>
          </div>
        </div>
      ) : null}
    </main>
  );
}
