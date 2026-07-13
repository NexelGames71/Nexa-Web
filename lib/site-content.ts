export const BRAND = {
  name: "Nexa AI",
  tagline: "Private AI assistant workspace powered by Ember 0.5.",
  description:
    "Nexa AI is a private assistant workspace for streaming chat, memory-aware workflows, image creation, browser assistance, and developer APIs.",
};

export const NAV_LINKS = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/models", label: "Models" },
  { href: "/api", label: "API" },
  { href: "/research", label: "Research" },
  { href: "/blog", label: "Blog" },
  { href: "/teaser", label: "Interactive Teaser" },
];

export const FOOTER_GROUPS = [
  {
    title: "Product",
    links: [
      { href: "/features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
      { href: "/models", label: "Models" },
      { href: "/chat", label: "Nexa Chat" },
      { href: "/browser", label: "Nexa Browser" },
      { href: "/teaser", label: "Interactive Teaser" },
    ],
  },
  {
    title: "Developers",
    links: [
      { href: "/developers", label: "Documentation" },
      { href: "/api", label: "API" },
      { href: "/models", label: "Models" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/careers", label: "Careers" },
      { href: "/blog", label: "Blog" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/security", label: "Security" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export const HERO = {
  eyebrow: "Nexa AI Platform",
  title: "Intelligence that remembers, searches, and acts with you.",
  subtitle:
    "Chat, voice, memory, and custom agents in one workspace. Built for individuals, teams, and enterprises.",
  primaryCta: { href: "/signup", label: "Get started free" },
  secondaryCta: { href: "/chat", label: "Open Nexa Chat" },
};

export const HOME_FEATURES = [
  {
    title: "Nexa Chat",
    description: "Streaming conversations powered by Ember 0.5 with Fast, Thinker, and Deep Thinker modes.",
    href: "/chat",
  },
  {
    title: "Nexa Memory",
    description: "User-controlled memory for preferences, facts, projects, and reusable context.",
    href: "/memory",
  },
  {
    title: "Nexa Search",
    description: "Search across conversations and workspace context, with web grounding when enabled.",
    href: "/search",
  },
  {
    title: "Nexa Images",
    description: "Create, reopen, inspect, and manage generated images through Prism 0.5.",
    href: "/images",
  },
  {
    title: "Nexa Voice",
    description: "Voice interaction direction prepared for hands-free assistant workflows.",
    href: "/voice",
  },
  {
    title: "Nexa API",
    description: "Developer routes for chat, model access, memory, streaming, and usage tracking.",
    href: "/api",
  },
];

export const PLATFORM_FEATURES = [
  {
    id: "chat",
    title: "Nexa Chat",
    description:
      "Streamed conversations, model picker, archives, and a sidebar built for daily use.",
    bullets: ["Streaming replies", "Model switching", "Chat history", "Quick actions"],
  },
  {
    id: "browser",
    title: "Nexa Browser",
    description: "Browse with AI context — product site coming soon.",
    bullets: ["AI summaries", "Page-aware chat", "Secure browsing", "Roadmap preview"],
    badge: "Coming soon",
  },
  {
    id: "voice",
    title: "Nexa Voice",
    description: "Hands-free conversations with the same memory and models as chat.",
    bullets: ["Real-time voice", "Interruptible replies", "Speaker modes", "Mobile ready"],
  },
  {
    id: "memory",
    title: "Nexa Memory",
    description: "Teach Nexa who you are — names, preferences, skills, and projects.",
    bullets: ["User profile", "Facts & preferences", "Project context", "Memory controls"],
  },
  {
    id: "search",
    title: "Nexa Search",
    description: "Find answers across your workspace and the open web.",
    bullets: ["Chat search", "File search", "Web grounding", "Citations"],
  },
  {
    id: "agents",
    title: "Nexa Agents",
    description: "Explore and build assistants tailored to your workflows.",
    bullets: ["Preset assistants", "Custom instructions", "Shareable agents", "Create flow"],
  },
  {
    id: "api",
    title: "Nexa API",
    description: "Production APIs with transparent pricing and developer tooling.",
    bullets: ["REST endpoints", "SDKs", "Usage dashboards", "Enterprise SLAs"],
  },
];

export const PRICING_PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "Free",
    period: "",
    description: "Start with core Nexa chat access and light daily usage.",
    features: ["Core model", "Basic chat history", "Limited uploads", "Community support"],
    cta: { href: "/signup", label: "Start free" },
    highlighted: false,
  },
  {
    id: "plus",
    name: "Nexa Plus",
    price: "$17",
    period: "/ month",
    description: "Unlock the full personal Nexa experience for everyday AI work.",
    features: [
      "Advanced models",
      "Advanced image creation with thinking",
      "Expanded memory across chats",
      "Coding assistant access",
      "Expanded research",
      "Projects and custom assistants",
    ],
    cta: { href: "/checkout?plan=plus", label: "Upgrade to Plus" },
    highlighted: true,
  },
  {
    id: "pro",
    name: "Nexa Pro",
    price: "$90",
    period: "/ month",
    description: "Maximize productivity with higher access, stronger models, and faster creative work.",
    features: [
      "Everything in Plus",
      "About 5x more usage than Plus",
      "Frontier Pro model routing",
      "Maximum access to coding tools",
      "Maximum deep research",
      "Unlimited core chat subject to abuse guardrails",
      "Unlimited and faster image creation subject to abuse guardrails",
      "Maximum memory and context",
      "Early access to experimental features",
    ],
    cta: { href: "/checkout?plan=pro", label: "Upgrade to Pro" },
    highlighted: false,
  },
  {
    id: "premium",
    name: "Nexa Premium",
    price: "$120",
    period: "/ month",
    description: "For heavy AI work with premium limits, Deep Thinker access, and priority support.",
    features: ["Everything in Pro", "Highest Deep Thinker access", "Premium image quality", "Custom assistant workflows", "Priority plus support"],
    cta: { href: "/checkout?plan=premium", label: "Go Premium" },
    highlighted: false,
  },
  {
    id: "business",
    name: "Nexa Business",
    price: "$20",
    period: "/ seat / month",
    description: "A secure workspace with company context and tools for teams.",
    features: [
      "Access Nexa across desktop and mobile apps",
      "AI for chat, coding, analysis, and workflows",
      "Connect company tools and knowledge sources",
      "Team agent plugins and shared context",
      "Centralized billing and administration",
      "Usage analytics, budgeting, and spend controls",
      "Secure workspace with SSO and MFA readiness",
      "No training on business data by default",
    ],
    cta: { href: "/checkout?plan=business", label: "Start Business" },
    highlighted: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Private deployments, custom models, and dedicated support.",
    features: ["Private deploy", "Custom AI", "Security review", "Dedicated CSM"],
    cta: { href: "/enterprise", label: "Talk to us" },
    highlighted: false,
  },
];

export const MODELS = [
  {
    id: "ember-0-5",
    name: "Ember 0.5",
    description: "Nexa's first official text/chat model for streaming conversations, everyday assistance, early reasoning, and browser-aware workflows.",
    status: "Text model",
  },
  {
    id: "prism-0-5",
    name: "Prism 0.5",
    description: "Nexa's first-generation image model for visual creation, concept art, image ideation, and creative workflows.",
    status: "Image model",
  },
  {
    id: "ember-1-0",
    name: "Ember 1.0",
    description: "The next planned Ember release focused on stronger reasoning, lower latency, and better browser assistance.",
    status: "Roadmap",
  },
  {
    id: "prism-next",
    name: "Prism Next",
    description: "Planned visual model improvements for sharper prompt following, higher fidelity, and richer creative control.",
    status: "Roadmap",
  },
];

export const TESTIMONIALS = [
  {
    quote: "Nexa feels like the assistant I actually keep open all day.",
    author: "Jordan Lee",
    role: "Product Lead",
  },
  {
    quote: "Memory and search together changed how our team onboards projects.",
    author: "Samira Khan",
    role: "Engineering Manager",
  },
  {
    quote: "The API was straightforward — we shipped an internal copilot in a week.",
    author: "Alex Rivera",
    role: "Founder",
  },
];

export const EXPLORE_ASSISTANTS = [
  { name: "Programming Assistant", description: "Debug, refactor, and explain code.", slug: "programming" },
  { name: "Business Coach", description: "Strategy, decks, and decision support.", slug: "business" },
  { name: "Marketing Assistant", description: "Campaigns, copy, and audience ideas.", slug: "marketing" },
  { name: "Travel Assistant", description: "Itineraries, packing, and local tips.", slug: "travel" },
];

export const ENTERPRISE_FEATURES = [
  "Custom AI fine-tuning",
  "Private deployments (VPC / on-prem)",
  "Team management & RBAC",
  "API access with dedicated quotas",
  "Security reviews & DPA",
  "24/7 priority support",
];

export const SECURITY_SECTIONS = [
  {
    title: "Encryption",
    body: "Data in transit uses TLS 1.2+. Sensitive fields at rest are encrypted in Appwrite and object storage.",
  },
  {
    title: "Privacy",
    body: "You control training opt-in, exports, and deletion from Data Controls in settings.",
  },
  {
    title: "Data handling",
    body: "Conversations and memory are scoped per user with owner-only permissions by default.",
  },
];

export const API_SECTIONS = [
  { title: "Models", href: "/models", description: "Fast, Think, and Deep Think endpoints." },
  { title: "Pricing", href: "/pricing", description: "Usage-based tiers aligned with chat plans." },
  { title: "Examples", href: "/developers", description: "curl, Python, and TypeScript samples." },
  { title: "SDKs", href: "/developers", description: "Official client libraries and OpenAI-compatible routes." },
];

export const BLOG_POSTS = [
  {
    slug: "introducing-ember-0-5",
    title: "Introducing Ember 0.5, Nexa's first official text model",
    date: "2026-07-12",
    category: "Model release",
    excerpt:
      "Ember 0.5 powers the core Nexa chat experience with streaming responses, everyday assistance, early reasoning, and browser-aware workflow foundations.",
    sections: [
      {
        title: "Why Ember matters",
        body:
          "Ember 0.5 is the first official model release identity in the Nexa model family. It gives the assistant stack a clear product name, a stable public story, and a foundation for future versions such as Ember 1.0 and Ember 1.5.",
      },
      {
        title: "What it powers today",
        body:
          "Ember powers the core text/chat experience: direct answers, writing support, explanations, planning, summarization, coding guidance, and structured responses. The model is routed through Nexa's private runtime and is designed to stream output while responses are generated.",
      },
      {
        title: "Runtime direction",
        body:
          "The Ember runtime direction is private inference first. Nexa tracks usage, supports mode-based generation, and keeps the assistant stack under Nexa control instead of exposing underlying provider names on public product pages.",
      },
    ],
  },
  {
    slug: "prism-0-5-image-generation",
    title: "Prism 0.5 gives Nexa image generation a model identity",
    date: "2026-07-12",
    category: "Image generation",
    excerpt:
      "Prism 0.5 is the Nexa image-generation model identity for visual creation, concept exploration, and the generated image library.",
    sections: [
      {
        title: "A dedicated image model name",
        body:
          "Prism 0.5 separates Nexa's visual generation story from the text assistant. It is the model identity users see when they create generated images, reopen prior work, and manage visual outputs from the image library.",
      },
      {
        title: "How it fits the product",
        body:
          "Prism supports product concepts, logos, interior renders, app hero imagery, creative drafts, and visual exploration. Generated images are stored in the user's Nexa library with prompt and metadata context.",
      },
      {
        title: "Where it goes next",
        body:
          "Future Prism versions will focus on sharper prompt following, higher fidelity, richer controls, and tighter integration between chat, image prompts, and generated assets.",
      },
    ],
  },
  {
    slug: "nexa-private-runtime",
    title: "Building Nexa around a private model runtime",
    date: "2026-07-12",
    category: "Infrastructure",
    excerpt:
      "Nexa is designed around local/private model APIs, CUDA-aware inference, streaming routes, model usage tracking, and admin visibility.",
    sections: [
      {
        title: "Private infrastructure first",
        body:
          "Nexa's backend direction keeps model execution in the Nexa runtime layer. The stack is structured so chat, image generation, usage tracking, admin model visibility, and future model routes can evolve without tying the product to an external project folder.",
      },
      {
        title: "Operational visibility",
        body:
          "The admin model dashboard tracks active model records, request counts, tokens, latency, runtime metadata, and plan access. That visibility matters as Nexa adds more model families and user-facing modes.",
      },
      {
        title: "Mode-based generation",
        body:
          "Fast, Thinker, and Deep Thinker modes are product-facing controls that map to response style, token budget, and reasoning depth. Users should choose the kind of work they need without seeing internal provider names.",
      },
    ],
  },
  {
    slug: "browser-aware-assistant-direction",
    title: "Nexa's browser-aware assistant direction",
    date: "2026-07-12",
    category: "Product direction",
    excerpt:
      "Nexa is being built beyond chat toward page understanding, form assistance, research support, and user-approved browser workflows.",
    sections: [
      {
        title: "Not just a chatbot",
        body:
          "The long-term Nexa product is an AI assistant that understands browser context. Chat is the center of the current workspace, but the product direction includes summaries, page-aware help, tab context, form assistance, and workflow guidance.",
      },
      {
        title: "Safety by design",
        body:
          "Browser actions need permission-aware controls. Low-risk actions such as summarizing a page can be lightweight, while sensitive actions such as submitting forms, sending messages, or changing account settings require clear user approval.",
      },
      {
        title: "Shared model stack",
        body:
          "Browser workflows should reuse the same Nexa identity, memory controls, model routing, and assistant modes as chat so the product feels like one system instead of disconnected tools.",
      },
    ],
  },
];

export const CAREERS = [
  { title: "Senior Frontend Engineer", location: "Remote", team: "Product" },
  { title: "ML Engineer — Inference", location: "Remote", team: "Research" },
  { title: "Developer Advocate", location: "Remote", team: "Growth" },
];

export const APP_PRODUCT_PAGES = {
  workspace: {
    title: "Workspace",
    subtitle: "Projects, notes, and documents together with your Nexa chats.",
    status: "Preview",
    highlights: [
      "Organize chats by project without losing memory context",
      "Attach notes and briefs that Nexa can reference in replies",
      "Share read-only project views with teammates on Business plans",
      "Export project bundles alongside your Data Controls export",
    ],
    steps: [
      { title: "Create a project", body: "Group related chats under one workspace with a name and goal." },
      { title: "Add context", body: "Pin files, links, and notes Nexa should remember for that project." },
      { title: "Chat inside the project", body: "Open Nexa Chat with project scope so answers stay on-topic." },
    ],
    primaryCta: { href: "/chat", label: "Open Nexa Chat" },
    secondaryCta: { href: "/features", label: "See all features" },
  },
  tasks: {
    title: "Tasks",
    subtitle: "Turn conversations into tracked work with AI-assisted follow-ups.",
    status: "Preview",
    highlights: [
      "Create tasks from any chat message in one click",
      "Due dates, priorities, and reminders synced to your account",
      "Let Nexa draft subtasks and checklists from meeting notes",
      "Mark done tasks as memory so future chats stay informed",
    ],
    steps: [
      { title: "Capture from chat", body: "Highlight an assistant reply and save it as a task with context." },
      { title: "Review your queue", body: "See open, scheduled, and completed work in one Tasks view." },
      { title: "Ask Nexa to continue", body: "Resume a task in chat — Nexa loads the original thread summary." },
    ],
    primaryCta: { href: "/chat", label: "Start in chat" },
    secondaryCta: { href: "/explore", label: "Explore assistants" },
  },
  library: {
    title: "Library",
    subtitle: "Files, images, and generated assets from your Nexa sessions.",
    status: "Preview",
    highlights: [
      "Upload documents for chat grounding and search",
      "Browse images and exports created in conversations",
      "Filter by project, date, or file type",
      "Download or delete assets under your data controls policy",
    ],
    steps: [
      { title: "Upload", body: "Add PDFs, slides, or images from chat or this library view." },
      { title: "Reuse", body: "Attach library items to new chats without re-uploading." },
      { title: "Manage", body: "Archive or remove files when you run a data export or deletion." },
    ],
    primaryCta: { href: "/chat", label: "Upload from chat" },
    secondaryCta: { href: "/settings/data", label: "Data controls" },
  },
  voice: {
    title: "Nexa Voice",
    subtitle: "Hands-free conversations with the same memory, models, and archives as chat.",
    status: "Rolling out",
    highlights: [
      "Low-latency speech with interruptible responses",
      "Uses your Nexa memory profile and thinking mode preferences",
      "Switch between speakers and push-to-talk on mobile",
      "Voice sessions appear in chat history for continuity",
    ],
    steps: [
      { title: "Enable microphone", body: "Grant access once — Nexa Voice runs in the browser." },
      { title: "Pick a mode", body: "Fast for quick questions, Think for longer reasoning." },
      { title: "Review transcript", body: "Every voice session saves as a chat you can search later." },
    ],
    primaryCta: { href: "/chat", label: "Try chat first" },
    secondaryCta: { href: "/pricing", label: "View plans" },
  },
  search: {
    title: "Nexa Search",
    subtitle: "Find messages, projects, and web answers across your workspace.",
    status: "Available in chat",
    highlights: [
      "Search all active and archived conversations from the chat sidebar",
      "Jump directly to the message where a topic was discussed",
      "Combine workspace search with web grounding in the composer",
      "Filter by date, project, or assistant preset",
    ],
    steps: [
      { title: "Open search", body: "Click the search icon in the chat sidebar or press the shortcut." },
      { title: "Type a query", body: "Nexa matches titles, snippets, and message content." },
      { title: "Open the thread", body: "Select a result to load the full conversation in place." },
    ],
    primaryCta: { href: "/chat", label: "Search your chats" },
    secondaryCta: { href: "/features", label: "Search features" },
  },
} as const;
