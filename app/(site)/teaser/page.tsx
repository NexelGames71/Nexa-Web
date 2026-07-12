"use client";

import { useEffect, useRef, useState } from "react";

interface Scene {
  id: number;
  title: string;
  visualDescription: string;
  voiceover: string[];
  mockupType: "multitask" | "chat" | "browser" | "usecases" | "personalization" | "ecosystem" | "closing";
}

interface VoiceSample {
  id: string;
  name: string;
  source: string;
  description: string;
  format: string;
}

const NEXA_FACTS = [
  { label: "Private model runtime", value: "Qwen3 local inference with CUDA acceleration" },
  { label: "Core workspace", value: "Chat, memory, image generation, search, billing, and admin controls" },
  { label: "Browser direction", value: "Page reading, summaries, tab-aware assistance, and workflow automation" },
  { label: "Voice stack", value: "F5-TTS and Qwen3-TTS research models prepared for Nexa Voice" }
];

const VOICE_SAMPLES: VoiceSample[] = [
  {
    id: "nexa",
    name: "Nexa Voice",
    source: "/voices/nexa-voice-nexa.wav",
    description: "Core Nexa voice reference from the Nexa_Voice library.",
    format: "WAV"
  },
  {
    id: "brad",
    name: "Brad Voice",
    source: "/voices/nexa-voice-brad.wav",
    description: "Brad WAV reference from the Nexa_Voice library.",
    format: "WAV"
  },
  {
    id: "clara",
    name: "Clara Voice",
    source: "/voices/nexa-voice-clara.wav",
    description: "Clara WAV reference from the Nexa_Voice library.",
    format: "WAV"
  },
  {
    id: "corey",
    name: "Corey Voice",
    source: "/voices/nexa-voice-corey.wav",
    description: "Corey WAV reference from the Nexa_Voice library.",
    format: "WAV"
  },
  {
    id: "tyler",
    name: "Tyler Voice",
    source: "/voices/nexa-voice-tyler.wav",
    description: "Tyler WAV reference from the Nexa_Voice library.",
    format: "WAV"
  },
  {
    id: "candidate-1",
    name: "Nexa Candidate 1",
    source: "/voices/nexa-voice-candidate-1.wav",
    description: "Candidate WAV voice captured in the Nexa_Voice root folder.",
    format: "WAV"
  },
  {
    id: "candidate-2",
    name: "Nexa Candidate 2",
    source: "/voices/nexa-voice-candidate-2.wav",
    description: "Candidate WAV voice captured in the Nexa_Voice root folder.",
    format: "WAV"
  },
  {
    id: "candidate-3",
    name: "Nexa Candidate 3",
    source: "/voices/nexa-voice-candidate-3.wav",
    description: "Candidate WAV voice captured in the Nexa_Voice root folder.",
    format: "WAV"
  }
];

const SCENES: Scene[] = [
  {
    id: 1,
    title: "Nexa Mission",
    visualDescription: "Visual: A focused workspace where chat, browser context, files, voice, and image tools are visible as one product.",
    voiceover: [
      "Nexa AI is a private AI assistant and browser platform from Nexa Labs.",
      "It is being built as more than a chatbot: a workspace that can chat, remember useful context, help research the web, generate images, and support voice interaction.",
      "The goal is a fast, capable assistant that feels integrated with how people actually work."
    ],
    mockupType: "multitask"
  },
  {
    id: 2,
    title: "Nexa Chat",
    visualDescription: "Visual: Nexa Chat streaming a structured answer with Fast, Thinker, and Deep Thinker modes available.",
    voiceover: [
      "Nexa Chat runs on a private local model API, with streaming responses so the assistant starts writing as it thinks.",
      "Fast, Thinker, and Deep Thinker modes are designed to balance speed, depth, and token budget for different tasks.",
      "Nexa can help with research, writing, code, planning, image prompts, and everyday productivity from the same workspace."
    ],
    mockupType: "chat"
  },
  {
    id: 3,
    title: "Nexa Web",
    visualDescription: "Visual: Browser content being read by an assistant panel with page summaries and suggested next actions.",
    voiceover: [
      "With Nexa Web, AI becomes part of your browsing experience.",
      "It is designed to summarize pages, explain complex content, help with forms, manage tabs, and support user-approved workflows.",
      "Sensitive actions are designed to require clear user confirmation before Nexa acts."
    ],
    mockupType: "browser"
  },
  {
    id: 4,
    title: "Who Nexa Helps",
    visualDescription: "Visual: Students, developers, creators, founders, and teams using the same assistant for different outcomes.",
    voiceover: [
      "Students can use Nexa for explanations, notes, and research support.",
      "Developers can use Nexa for code review, debugging, architecture planning, and documentation.",
      "Creators and businesses can use Nexa for briefs, scripts, proposals, support drafts, and workflow planning."
    ],
    mockupType: "usecases"
  },
  {
    id: 5,
    title: "Memory And Privacy",
    visualDescription: "Visual: User-controlled memory profile with preferences, projects, and data controls separated clearly.",
    voiceover: [
      "Nexa memory is built around user control.",
      "The assistant can use saved preferences, project context, and workspace settings to answer more usefully over time.",
      "Chat history, memory, browser activity, files, and generated assets are treated as separate data surfaces."
    ],
    mockupType: "personalization"
  },
  {
    id: 6,
    title: "Nexa Platform",
    visualDescription: "Visual: Nexa ecosystem screens: AI, Web, Cloud, API, Workspace.",
    voiceover: [
      "Nexa is becoming a connected AI platform.",
      "The product direction includes chat, voice, memory, image generation, browser assistance, developer APIs, workspaces, and admin controls.",
      "Built by Nexa Labs for private, practical AI work."
    ],
    mockupType: "ecosystem"
  },
  {
    id: 7,
    title: "Launch Preview",
    visualDescription: "Visual: Nexa AI logo, product UI, call-to-action text.",
    voiceover: [
      "Meet Nexa AI. Experience Nexa Web.",
      "A private assistant, browser companion, and productivity platform built by Nexa Labs.",
      "Chat smarter. Browse smarter. Create faster."
    ],
    mockupType: "closing"
  }
];

export default function TeaserPage() {
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"cinematic" | "storyboard">("cinematic");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [speakingParagraphIndex, setSpeakingParagraphIndex] = useState(0);
  const [selectedVoiceSampleId, setSelectedVoiceSampleId] = useState(VOICE_SAMPLES[0].id);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [sceneProgress, setSceneProgress] = useState(0);

  const activeScene = SCENES[activeSceneIndex];
  const selectedVoiceSample = VOICE_SAMPLES.find((sample) => sample.id === selectedVoiceSampleId) || VOICE_SAMPLES[0];

  // Nexa WAV narrator manager.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = playbackSpeed;

    if (viewMode !== "cinematic" || !isPlaying) {
      audio.pause();
      return;
    }

    audio.currentTime = 0;
    setSceneProgress(0);
    setSpeakingParagraphIndex(0);
    void audio.play().catch(() => setIsPlaying(false));
  }, [activeSceneIndex, isPlaying, playbackSpeed, selectedVoiceSampleId, viewMode]);

  const handleNextScene = () => {
    setActiveSceneIndex((prev) => {
      if (prev < SCENES.length - 1) {
        setSpeakingParagraphIndex(0);
        return prev + 1;
      } else {
        setIsPlaying(false);
        return prev;
      }
    });
  };

  const handlePrevScene = () => {
    setActiveSceneIndex((prev) => {
      if (prev > 0) {
        setSpeakingParagraphIndex(0);
        return prev - 1;
      }
      return prev;
    });
  };

  const handleTogglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleAudioTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
    if (!duration) return;

    const progress = Math.min(100, (audio.currentTime / duration) * 100);
    const lineCount = activeScene.voiceover.length;
    const nextIndex = Math.min(lineCount - 1, Math.floor((progress / 100) * lineCount));
    setSceneProgress(progress);
    setSpeakingParagraphIndex(nextIndex);
  };

  const handleAudioEnded = () => {
    setSceneProgress(100);
    handleNextScene();
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-white">
      {/* Teaser Header Banner */}
      <div className="mx-auto max-w-6xl px-5 pt-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-white/10 pb-6">
          <div className="max-w-3xl">
            <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 uppercase tracking-widest">
              Nexa Labs Product Preview
            </span>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">
              Nexa AI and Nexa Web, shown as an interactive product teaser
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Explore the private AI assistant, browser companion, memory system, image tools, and voice direction behind Nexa.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-zinc-900/60 p-1 border border-white/5">
            <button
              onClick={() => {
                setViewMode("cinematic");
                setIsPlaying(false);
              }}
              className={`rounded-lg px-4 py-2 text-xs font-medium transition ${
                viewMode === "cinematic" ? "bg-white text-zinc-950 shadow-md" : "text-zinc-400 hover:text-white"
              }`}
            >
              Cinematic Player
            </button>
            <button
              onClick={() => {
                setViewMode("storyboard");
                setIsPlaying(false);
                audioRef.current?.pause();
              }}
              className={`rounded-lg px-4 py-2 text-xs font-medium transition ${
                viewMode === "storyboard" ? "bg-white text-zinc-950 shadow-md" : "text-zinc-400 hover:text-white"
              }`}
            >
              Storyboard View
            </button>
          </div>
        </div>

        <div className="grid gap-3 border-b border-white/10 py-6 md:grid-cols-4">
          {NEXA_FACTS.map((fact) => (
            <div key={fact.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                {fact.label}
              </div>
              <div className="mt-2 text-sm leading-relaxed text-zinc-200">
                {fact.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Viewport */}
      <div className="mx-auto max-w-6xl px-5 py-8">
        {viewMode === "cinematic" ? (
          /* Cinematic Player Mode */
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Left Column: Visual Mockup Screen */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/40 p-1 shadow-[0_30px_100px_rgba(0,0,0,0.8)] backdrop-blur-md">
                {/* Glowing Aura Gradient Behind */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-60 pointer-events-none" />
                
                {/* Simulated Screen Body */}
                <div className="relative h-full w-full overflow-hidden rounded-[22px] bg-zinc-950 flex flex-col select-none">
                  {/* Mock Screen Header Bar */}
                  <div className="flex h-9 w-full items-center justify-between border-b border-white/5 bg-zinc-900/40 px-4">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-500/40" />
                      <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/40" />
                      <div className="h-2.5 w-2.5 rounded-full bg-green-500/40" />
                    </div>
                    <div className="rounded bg-white/5 px-4 py-0.5 text-[10px] tracking-wide text-zinc-500 font-mono">
                      nexa.ai/preview/scene_{activeScene.id}
                    </div>
                    <div className="w-10" />
                  </div>

                  {/* Render Visual Mockup Container */}
                  <div className="flex-1 overflow-hidden relative">
                    <MockupDisplay type={activeScene.mockupType} isPlaying={isPlaying} />
                  </div>
                </div>

                {/* Progress bar overlay */}
                {isPlaying && (
                  <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-100" style={{ width: `${sceneProgress}%` }} />
                )}
              </div>

              {/* Scene Indicator & Controller Bar */}
              <div className="flex items-center justify-between rounded-2xl bg-zinc-900/40 border border-white/5 p-4 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleTogglePlay}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-zinc-950 hover:bg-zinc-200 transition active:scale-95"
                    aria-label={isPlaying ? "Pause presentation" : "Play presentation"}
                  >
                    {isPlaying ? (
                      /* Pause Icon */
                      <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                        <rect x="5" y="4" width="4" height="16" rx="1" />
                        <rect x="15" y="4" width="4" height="16" rx="1" />
                      </svg>
                    ) : (
                      /* Play Icon */
                      <svg className="h-5 w-5 fill-current translate-x-0.5" viewBox="0 0 24 24">
                        <path d="M7 3.5v17a.5.5 0 00.784.412l11.333-8.5a.5.5 0 000-.824L7.784 3.088A.5.5 0 007 3.5z" />
                      </svg>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handlePrevScene}
                      disabled={activeSceneIndex === 0}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 bg-zinc-950/40 text-zinc-400 hover:text-white disabled:opacity-40 transition"
                      aria-label="Previous scene"
                    >
                      Prev
                    </button>
                    <button
                      onClick={handleNextScene}
                      disabled={activeSceneIndex === SCENES.length - 1}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 bg-zinc-950/40 text-zinc-400 hover:text-white disabled:opacity-40 transition"
                      aria-label="Next scene"
                    >
                      Next
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-zinc-500 font-mono">
                    Scene {activeScene.id} of {SCENES.length}
                  </div>
                  <div className="text-sm font-semibold text-zinc-200 mt-0.5">
                    {activeScene.title}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Audio & Script Text Container */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Narration Controls Card */}
              <div className="rounded-3xl border border-white/10 bg-zinc-900/20 p-6 backdrop-blur-md">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Nexa WAV narrator
                </h3>
                <p className="mt-1 text-xs text-zinc-400">
                  Select a real WAV voice from Nexa_Voice. The chosen voice drives the teaser script playback.
                </p>

                <div className="mt-4 flex flex-col gap-4">
                  <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-4">
                    <div className="flex flex-col gap-3">
                      <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                        AI voice sample
                      </label>
                      <select
                        value={selectedVoiceSampleId}
                        onChange={(e) => setSelectedVoiceSampleId(e.target.value)}
                        className="rounded-xl border border-white/10 bg-zinc-950 p-2.5 text-xs text-zinc-200 outline-none focus:border-indigo-500"
                      >
                        {VOICE_SAMPLES.map((sample) => (
                          <option key={sample.id} value={sample.id}>
                            {sample.name} ({sample.format})
                          </option>
                        ))}
                      </select>
                      <p className="text-xs leading-relaxed text-zinc-400">
                        {selectedVoiceSample.description}
                      </p>
                      <audio
                        ref={audioRef}
                        src={selectedVoiceSample.source}
                        controls
                        className="w-full"
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onTimeUpdate={handleAudioTimeUpdate}
                        onEnded={handleAudioEnded}
                      />
                    </div>
                  </div>

                  {/* Playback Speed controls */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">WAV playback speed</span>
                    <div className="flex gap-1.5">
                      {[1, 1.25, 1.5].map((speed) => (
                        <button
                          key={speed}
                          onClick={() => setPlaybackSpeed(speed)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-mono transition ${
                            playbackSpeed === speed ? "bg-white/10 text-white font-bold" : "text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Script Text Box */}
              <div className="flex-1 flex flex-col rounded-3xl border border-white/10 bg-zinc-900/20 p-6 backdrop-blur-md relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-950/20 pointer-events-none" />

                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
                  Script Voiceover / Subtitles
                </h3>

                <div className="mt-4 flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
                  {activeScene.voiceover.map((p, idx) => {
                    const isCurrent = idx === speakingParagraphIndex && isPlaying;
                    return (
                      <p
                        key={idx}
                        className={`text-base leading-relaxed transition-all duration-300 ${
                          isCurrent
                            ? "text-indigo-400 font-medium scale-[1.01] translate-x-1"
                            : isPlaying
                            ? "text-zinc-600 opacity-60"
                            : "text-zinc-300"
                        }`}
                      >
                        {isCurrent && <span className="inline-block mr-1">Live:</span>}
                        {p}
                      </p>
                    );
                  })}
                </div>

                {/* Director visual cue */}
                <div className="mt-6 border-t border-white/5 pt-4">
                  <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    Director Visual Note
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400 italic">
                    {activeScene.visualDescription}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Storyboard Mode: List of Cards */
          <div className="flex flex-col gap-10">
            {SCENES.map((scene, idx) => (
              <div
                key={scene.id}
                className="group relative grid gap-6 rounded-3xl border border-white/10 bg-zinc-900/20 p-6 backdrop-blur-md hover:border-white/20 transition-all duration-300 lg:grid-cols-12"
              >
                {/* Visual Representation (Left Col) */}
                <div className="lg:col-span-5 flex flex-col gap-3">
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-white/5 bg-zinc-950">
                    <MockupDisplay type={scene.mockupType} isPlaying={false} />
                  </div>
                  <div className="rounded-xl bg-zinc-950/80 p-3 border border-white/5">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Visual Cue</span>
                    <span className="text-xs text-zinc-400 mt-1 block italic">{scene.visualDescription}</span>
                  </div>
                </div>

                {/* Voiceover Details (Right Col) */}
                <div className="lg:col-span-7 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-zinc-500 font-bold uppercase">
                        Scene {scene.id}
                      </span>
                      <span className="text-sm font-semibold text-zinc-300">
                        {scene.title}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {scene.voiceover.map((voiceLine, lineIdx) => (
                        <div key={lineIdx} className="flex gap-3">
                          <span className="text-zinc-600 text-xs font-mono mt-1 shrink-0">{`[VO-${lineIdx + 1}]`}</span>
                          <p className="text-sm leading-relaxed text-zinc-200">
                            {voiceLine}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => {
                        setActiveSceneIndex(idx);
                        setViewMode("cinematic");
                        setIsPlaying(true);
                      }}
                      className="rounded-xl bg-white/10 px-4 py-2 text-xs font-medium text-white hover:bg-white/15 transition flex items-center gap-1.5"
                    >
                      <span>Preview Scene</span>
                      <span>Next</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   VISUAL MOCKUP COMPONENTS
   Fully reactive React + CSS animations representing Nexa products
   ========================================================================== */

function MockupDisplay({ type, isPlaying }: { type: Scene["mockupType"]; isPlaying: boolean }) {
  switch (type) {
    case "multitask":
      return <MockupMultitask isPlaying={isPlaying} />;
    case "chat":
      return <MockupChat isPlaying={isPlaying} />;
    case "browser":
      return <MockupBrowser isPlaying={isPlaying} />;
    case "usecases":
      return <MockupUseCases isPlaying={isPlaying} />;
    case "personalization":
      return <MockupPersonalization isPlaying={isPlaying} />;
    case "ecosystem":
      return <MockupEcosystem isPlaying={isPlaying} />;
    case "closing":
      return <MockupClosing isPlaying={isPlaying} />;
    default:
      return <div className="h-full w-full bg-zinc-900" />;
  }
}

// Scene 1: Multitask Simulation (typing, tab switching)
function MockupMultitask({ isPlaying }: { isPlaying: boolean }) {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ["IDE Editor", "Documentation", "Chrome Browser"];

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % tabs.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="h-full w-full flex flex-col bg-zinc-950 p-4 font-mono text-[11px]">
      {/* Top Window Tabs */}
      <div className="flex border-b border-white/5 pb-2 mb-3 gap-2 overflow-x-auto">
        {tabs.map((tab, idx) => (
          <div
            key={idx}
            className={`rounded-lg px-3 py-1.5 transition duration-300 shrink-0 ${
              activeTab === idx ? "bg-white/10 text-white border border-white/10" : "text-zinc-600 border border-transparent"
            }`}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* Workspace Area */}
      <div className="flex-1 rounded-xl bg-zinc-900/30 border border-white/5 p-4 overflow-hidden relative">
        {activeTab === 0 && (
          <div className="text-zinc-400 space-y-2">
            <p className="text-zinc-600">{`// Code editor auto-saving`}</p>
            <p className="text-indigo-400">import <span className="text-white">{`{ NexaClient }`}</span> from <span className="text-emerald-400">"nexa-sdk"</span>;</p>
            <p className="text-indigo-400">const <span className="text-white">client</span> = new <span className="text-yellow-400">NexaClient</span>({`{`}</p>
            <p className="pl-4 text-zinc-300">apiKey: process.env.NEXA_API_KEY,</p>
            <p className="pl-4 text-zinc-300">workspaceId: <span className="text-emerald-400">"nexa_web_dev_01"</span></p>
            <p className="text-indigo-400">{`});`}</p>
            <p className="text-zinc-500 animate-pulse mt-4">_</p>
          </div>
        )}

        {activeTab === 1 && (
          <div className="text-zinc-400 space-y-3">
            <p className="text-xs font-semibold text-zinc-200 uppercase tracking-widest border-b border-white/5 pb-1">Nexa Memory API</p>
            <p className="text-[11px] leading-relaxed text-zinc-400">
              The memory endpoint provides persistent, secure, and user-scoped grounding context. Sync profile tags to allow models to learn preferences.
            </p>
            <div className="rounded-lg bg-zinc-950 p-2.5 text-[11px] text-zinc-500 border border-white/5">
              GET /v1/memory?scope=preferences
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div className="text-zinc-400 flex flex-col h-full justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-lg bg-zinc-950 p-2 border border-white/5">
                <span className="text-emerald-500 text-xs">TLS</span>
                <span className="text-zinc-400 text-[11px] truncate">https://www.nexa.ai/docs/intro</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-2">
                Loading marketing documents...
              </p>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 animate-pulse" style={{ width: "70%" }} />
              </div>
            </div>
            <p className="text-[10px] text-zinc-600 text-right">Activity: Analyzing document structure</p>
          </div>
        )}

        {/* Floating Scan effect */}
        <div className="absolute inset-x-0 h-1/2 bg-gradient-to-b from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 top-0 animate-[scan_3s_ease-in-out_infinite] pointer-events-none" />
      </div>
    </div>
  );
}

// Scene 2: Nexa AI Chat streaming simulation
function MockupChat({ isPlaying }: { isPlaying: boolean }) {
  const [messages, setMessages] = useState<Array<{ r: "user" | "ai"; c: string }>>([
    { r: "user", c: "How do I optimize database queries?" }
  ]);
  const [streamingText, setStreamingText] = useState("");
  const responseText = "Here is how to optimize queries in Nexa Workspace:\n\n1. Ensure indexes exist on WHERE clause parameters.\n2. Limit fields returned to only requested columns.\n3. Implement local caching with Nexa Memory APIs.";

  useEffect(() => {
    if (!isPlaying) {
      setMessages([
        { r: "user", c: "How do I optimize database queries?" },
        { r: "ai", c: responseText }
      ]);
      setStreamingText("");
      return;
    }

    setMessages([{ r: "user", c: "How do I optimize database queries?" }]);
    setStreamingText("");

    let currentLength = 0;
    const interval = setInterval(() => {
      if (currentLength < responseText.length) {
        setStreamingText(responseText.substring(0, currentLength + 2));
        currentLength += 2;
      } else {
        clearInterval(interval);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="h-full w-full bg-zinc-950 flex flex-col p-4 text-[11px] font-sans">
      {/* Mini Top bar */}
      <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
        <span className="font-semibold text-zinc-300">Nexa Assistant</span>
        <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[9px] text-indigo-400">Nexa Think</span>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex flex-col ${m.r === "user" ? "items-end" : "items-start"}`}>
            <div
              className={`rounded-2xl px-3 py-2 max-w-[85%] leading-relaxed ${
                m.r === "user"
                  ? "bg-zinc-900 text-zinc-200 border border-white/5"
                  : "bg-indigo-500/10 text-indigo-200 border border-indigo-500/15"
              }`}
            >
              {m.c}
            </div>
          </div>
        ))}

        {streamingText && (
          <div className="flex flex-col items-start">
            <div className="rounded-2xl px-3 py-2 max-w-[85%] leading-relaxed bg-indigo-500/10 text-indigo-200 border border-indigo-500/15">
              {streamingText}
              <span className="ml-1 inline-block h-3 w-1.5 bg-indigo-400 animate-pulse align-middle" />
            </div>
          </div>
        )}
      </div>

      {/* Input box bottom */}
      <div className="mt-3 flex gap-2 rounded-xl bg-zinc-900/60 p-1.5 border border-white/5">
        <div className="flex-1 bg-transparent px-2.5 py-1.5 text-zinc-500 text-[10px]">
          Ask Nexa anything...
        </div>
        <div className="h-6 w-6 rounded-lg bg-white/10 flex items-center justify-center text-zinc-400">
          Send
        </div>
      </div>
    </div>
  );
}

// Scene 3: Browser Sidebar Context scan
function MockupBrowser({ isPlaying }: { isPlaying: boolean }) {
  const [scannedItems, setScannedItems] = useState<string[]>([]);
  const summaryPoints = [
    "Article: Launching a startup in 2026",
    "Goal: Explores AI integration and margins",
    "Summary: Replaces legacy chatbots with agents",
    "Action: Export proposal template"
  ];

  useEffect(() => {
    if (!isPlaying) {
      setScannedItems(summaryPoints);
      return;
    }

    setScannedItems([]);
    let index = 0;
    const interval = setInterval(() => {
      if (index < summaryPoints.length) {
        setScannedItems(prev => [...prev, summaryPoints[index]]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="h-full w-full bg-zinc-950 flex font-sans text-[11px]">
      {/* Left Pane: Web Page */}
      <div className="flex-1 border-r border-white/5 p-3 flex flex-col justify-between overflow-hidden relative">
        <div>
          <div className="h-3 w-1/3 bg-zinc-800 rounded mb-3" />
          <div className="space-y-1.5">
            <div className="h-2 w-full bg-zinc-900 rounded" />
            <div className="h-2 w-[90%] bg-zinc-900 rounded" />
            <div className="h-2 w-[95%] bg-zinc-900 rounded" />
            <div className="h-2 w-[80%] bg-zinc-900 rounded" />
          </div>
          <div className="h-3 w-1/4 bg-zinc-800 rounded mt-4 mb-2" />
          <div className="space-y-1.5">
            <div className="h-2 w-full bg-zinc-900 rounded" />
            <div className="h-2 w-[85%] bg-zinc-900 rounded" />
          </div>
        </div>
        <div className="rounded bg-white/5 px-2 py-1 text-[8px] text-zinc-500 font-mono tracking-wider">
          PAGE CONTENT DETECTED
        </div>

        {/* Scan Bar overlay */}
        {isPlaying && (
          <div className="absolute inset-x-0 h-0.5 bg-indigo-500 shadow-[0_0_10px_#6366f1] animate-[browserScan_2s_infinite]" />
        )}
      </div>

      {/* Right Pane: Nexa Assistant Panel */}
      <div className="w-[170px] bg-zinc-900/30 p-3 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 border-b border-white/5 pb-2 mb-3">
            <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase">Nexa Web</span>
          </div>

          <div className="space-y-2.5">
            {scannedItems.map((item, idx) => (
              <div key={idx} className="rounded-lg bg-zinc-950/60 p-2 border border-white/5 text-[10px] leading-relaxed text-zinc-300 animate-[fadeUp_0.4s_ease-out]">
                {item}
              </div>
            ))}
            {isPlaying && scannedItems.length < summaryPoints.length && (
              <div className="flex justify-center py-2">
                <span className="text-[10px] text-zinc-500 animate-pulse">Reading page...</span>
              </div>
            )}
          </div>
        </div>

        <button className="w-full rounded-lg bg-indigo-600 py-1.5 text-[9px] font-semibold hover:bg-indigo-700 transition">
          Add to Memory
        </button>
      </div>
    </div>
  );
}

// Scene 4: Use Cases (Students, Developers, Creators, Businesses tabs)
function MockupUseCases({ isPlaying }: { isPlaying: boolean }) {
  const [activeTab, setActiveTab] = useState(0);
  const useCaseTabs = ["Students", "Developers", "Creators", "Businesses"];

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % useCaseTabs.length);
    }, 1600);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="h-full w-full bg-zinc-950 flex flex-col p-4 font-sans text-[11px]">
      <div className="flex border-b border-white/5 pb-2 mb-4 gap-1.5 overflow-x-auto">
        {useCaseTabs.map((t, idx) => (
          <button
            key={t}
            onClick={() => setActiveTab(idx)}
            className={`rounded-lg px-2.5 py-1 text-[10px] font-medium transition ${
              activeTab === idx ? "bg-white text-zinc-950 font-bold" : "text-zinc-400 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 rounded-xl bg-zinc-900/30 border border-white/5 p-4 flex flex-col justify-between">
        {activeTab === 0 && (
          <div className="space-y-2 animate-[fadeUp_0.3s_ease-out]">
            <h4 className="font-semibold text-zinc-200">Study Guide: Mitochondria</h4>
            <p className="text-[11px] leading-relaxed text-zinc-400">
              The powerhouses of the cell. Generates adenosine triphosphate (ATP) from chemical energy.
            </p>
            <div className="rounded-lg bg-zinc-950 p-2 text-[9px] text-zinc-500 border border-white/5">
              Flashcard generated: Mitochondria = ATP Generator.
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="space-y-2 animate-[fadeUp_0.3s_ease-out] font-mono text-[10px]">
            <p className="text-zinc-500">{`// Reviewing file: user_api.ts`}</p>
            <div className="flex gap-2">
              <span className="text-red-400">- for (let i = 0; i &lt; data.length; i++)</span>
              <span className="text-zinc-600">| Deprecated loop</span>
            </div>
            <div className="flex gap-2">
              <span className="text-emerald-400">+ data.map(item =&gt; processItem(item))</span>
              <span className="text-zinc-600">| Refactored clean map</span>
            </div>
            <p className="text-indigo-400 mt-2 font-sans text-xs">Nexa: Optimized code array mapping.</p>
          </div>
        )}

        {activeTab === 2 && (
          <div className="space-y-2 animate-[fadeUp_0.3s_ease-out]">
            <h4 className="font-semibold text-zinc-200">Ad Copy Generator</h4>
            <div className="rounded-lg bg-zinc-950 p-2.5 border border-white/5 text-[11px] leading-relaxed text-zinc-400">
              "Say goodbye to chat tabs. Meet Nexa - the AI that remembers what you actually do. Try free."
            </div>
            <p className="text-[9px] text-zinc-600">Suggested Tone: Confident, Startup-style</p>
          </div>
        )}

        {activeTab === 3 && (
          <div className="space-y-2 animate-[fadeUp_0.3s_ease-out]">
            <h4 className="font-semibold text-zinc-200">Client Proposal Draft</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Section 1.4: Implementation Timelines. Integration of Nexa developer API will reduce internal ticket response delay by 45%.
            </p>
            <div className="w-full bg-zinc-950 p-2 rounded-lg text-[9px] text-zinc-500 border border-white/5 flex justify-between items-center">
              <span>Draft: API Integrations v1.docx</span>
              <span className="text-indigo-400 text-xs">Syncing...</span>
            </div>
          </div>
        )}

        <div className="text-[10px] text-zinc-500 text-right font-mono border-t border-white/5 pt-2 mt-2">
          nexa-workspace // use_case_simulation
        </div>
      </div>
    </div>
  );
}

// Scene 5: Memory Deck / Personalization
function MockupPersonalization({ isPlaying }: { isPlaying: boolean }) {
  const [profileIndex, setProfileIndex] = useState(88);
  const [tags, setTags] = useState([
    { id: 1, text: "Developer", active: true },
    { id: 2, text: "Prefers Python", active: true },
    { id: 3, text: "Concise Style", active: true },
    { id: 4, text: "Nexa-Web repo", active: true }
  ]);

  useEffect(() => {
    if (!isPlaying) {
      setProfileIndex(95);
      return;
    }

    const interval = setInterval(() => {
      setProfileIndex((prev) => {
        if (prev >= 100) return 80;
        return prev + 1;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="h-full w-full bg-zinc-950 flex flex-col p-4 font-sans text-[11px]">
      <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
        <span className="font-semibold text-zinc-300">Memory Profile</span>
        <span className="text-zinc-500 text-[10px]">Autorecord enabled</span>
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div>
          <p className="text-[11px] text-zinc-400 mb-3">
            Nexa automatically captures settings and rules from your workflow:
          </p>

          <div className="grid grid-cols-2 gap-2">
            {tags.map((tag) => (
              <div
                key={tag.id}
                onClick={() => {
                  setTags(current => current.map(t => t.id === tag.id ? { ...t, active: !t.active } : t));
                }}
                className={`rounded-xl p-2.5 border text-[10px] transition cursor-pointer select-none ${
                  tag.active
                    ? "bg-zinc-900 border-white/10 text-zinc-200"
                    : "bg-zinc-950/20 border-white/5 text-zinc-600 line-through"
                }`}
              >
                {tag.text}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <div className="flex justify-between text-[10px]">
            <span className="text-zinc-500">Workspace Personalization Index</span>
            <span className="text-indigo-400 font-bold font-mono">{profileIndex}%</span>
          </div>
          <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${profileIndex}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Scene 6: SVG Network Diagram
function MockupEcosystem({ isPlaying }: { isPlaying: boolean }) {
  const [activeNode, setActiveNode] = useState<string>("core");
  const nodes = [
    { id: "core", x: 125, y: 110, label: "Nexa Labs", color: "#6366f1" },
    { id: "ai", x: 60, y: 55, label: "Nexa AI", color: "#a855f7" },
    { id: "web", x: 190, y: 55, label: "Nexa Web", color: "#ec4899" },
    { id: "cloud", x: 60, y: 165, label: "Cloud API", color: "#f43f5e" },
    { id: "workspace", x: 190, y: 165, label: "Workspaces", color: "#3b82f6" }
  ];

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      const ids = nodes.map(n => n.id);
      setActiveNode(prev => {
        const idx = ids.indexOf(prev);
        return ids[(idx + 1) % ids.length];
      });
    }, 1800);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="h-full w-full bg-zinc-950 flex flex-col p-4 font-sans text-[11px]">
      <div className="flex-1 relative">
        <svg className="h-full w-full" viewBox="0 0 250 220">
          {/* Connector Laser Lines */}
          {nodes.slice(1).map((node) => (
            <line
              key={node.id}
              x1={nodes[0].x}
              y1={nodes[0].y}
              x2={node.x}
              y2={node.y}
              stroke={activeNode === node.id || activeNode === "core" ? node.color : "#27272a"}
              strokeWidth={activeNode === node.id ? 2 : 1}
              strokeDasharray={isPlaying ? "5, 5" : "none"}
              className={isPlaying ? "animate-[dash_8s_linear_infinite]" : ""}
            />
          ))}

          {/* Node Circles */}
          {nodes.map((node) => {
            const isActive = activeNode === node.id;
            return (
              <g
                key={node.id}
                className="cursor-pointer"
                onClick={() => setActiveNode(node.id)}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isActive ? 18 : 14}
                  fill="#09090b"
                  stroke={node.color}
                  strokeWidth={isActive ? 3 : 1.5}
                  className="transition-all duration-300"
                />
                <text
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  fill={isActive ? "#ffffff" : "#a1a1aa"}
                  fontSize={node.id === "core" ? "8" : "7"}
                  fontWeight={isActive ? "bold" : "normal"}
                  className="pointer-events-none"
                >
                  {node.id === "core" ? "Nexa" : node.label.split(" ")[1] || node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="rounded-xl bg-zinc-900/30 p-2.5 border border-white/5 min-h-[45px] text-[10px] text-zinc-400 text-center leading-relaxed">
        {activeNode === "core" && "Nexa Labs: The engineering hub building unified, memory-grounded AI tools."}
        {activeNode === "ai" && "Nexa AI: Intelligent assistant for research, coding, writing, and calculations."}
        {activeNode === "web" && "Nexa Web: Browser extensions that ground AI summaries in active page content."}
        {activeNode === "cloud" && "Cloud API: Developer models and database keys with enterprise endpoints."}
        {activeNode === "workspace" && "Workspaces: File libraries, tasks, and project logs grouped by campaign."}
      </div>
    </div>
  );
}

// Scene 7: Closing / Logo / CTA early-access
function MockupClosing({ isPlaying }: { isPlaying: boolean }) {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);

  return (
    <div className="h-full w-full bg-zinc-950 flex flex-col items-center justify-center p-4 text-center font-sans text-[11px] relative">
      {/* Pulsing Aura Circle behind */}
      <div className="absolute h-36 w-36 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 filter blur-xl animate-pulse pointer-events-none" />

      <div className="relative z-10 max-w-xs space-y-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-white">Nexa AI + Nexa Web</h3>
          <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1">Built by Nexa Labs</p>
        </div>

        <p className="text-[11px] text-zinc-400">
          Sign up to get notified when the beta drops and secure your workspace early.
        </p>

        {success ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-400 font-medium text-[10px] animate-[scaleIn_0.3s_ease-out]">
            You have been registered. Check your email for updates.
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (email.includes("@")) setSuccess(true);
            }}
            className="flex gap-2"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-[10px] outline-none focus:border-indigo-500"
              required
            />
            <button
              type="submit"
              className="rounded-xl bg-white px-3 py-2 text-[10px] font-bold text-zinc-950 hover:bg-zinc-200 transition"
            >
              Sign Up
            </button>
          </form>
        )}

        <div className="text-[9px] text-zinc-600">
          By signing up, you agree to our terms and privacy policy.
        </div>
      </div>
    </div>
  );
}
