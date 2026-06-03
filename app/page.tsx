"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Package,
  Plus,
  Menu,
  X,
  Send,
  Image,
  Film,
  Video,
  Layout,
  Code,
  Wand2,
  Play,
  RefreshCw,
  GitCompare,
  Trash2,
  Pencil,
  Check,
  Clock,
  BarChart3,
  Network,
  PieChart,
  Shapes,
  GitFork,
  Settings,
  User,
  ChevronDown,
  Sparkles,
  Maximize2,
  Minimize2,
  Copy,
  Download,
  MoreHorizontal,
  FileCode2,
  Eye,
  ThumbsUp,
  ThumbsDown,
  RotateCw,
  Bot,
  Images,
  PanelLeft,
  PanelRight,
  FolderOpen,
  SquarePen,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Square,
  Paperclip,
  Columns,
  Maximize,
  Minimize,
  ZoomIn,
  ZoomOut,
  Hand,
  Move,
} from "lucide-react";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import { useChatStore } from "@/lib/store/chat-store";
import { useSettingsStore } from "@/lib/store/settings-store";
import { useToast } from "@/lib/store/toast-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { AuthModal } from "@/components/auth/AuthModal";
import { formatDate, formatMessageTimestamp } from "@/lib/utils";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { API_CONFIG, AI_MODELS, FILE_UPLOAD_CONFIG } from "@/config/constants";
import { AIModel, ImageAttachment } from "@/types";

const P5Canvas = dynamic(() => import("@/components/p5/P5Canvas"), {
  ssr: false,
});
const D3Canvas = dynamic(() => import("@/components/d3/D3Canvas"), {
  ssr: false,
});
const SVGCanvas = dynamic(() => import("@/components/svg/SVGCanvas"), {
  ssr: false,
});
const MermaidCanvas = dynamic(
  () => import("@/components/mermaid/MermaidCanvas"),
  { ssr: false },
);
const CodeDiff = dynamic(() => import("@/components/p5/CodeDiff"), {
  ssr: false,
});

import { RendererType, Artifact } from "@/types";
import { extractCode } from "@/lib/extract-code";

// Artifact helper functions removed as state is now managed directly by Zustand ChatStore

const getRelativeTimeString = (dateInput: Date | string) => {
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getCategoryInfo = (renderer: RendererType, code: string = "", title: string = "") => {
  const t = title.toLowerCase();
  const c = code.toLowerCase();
  const r = renderer || "p5";

  if (r === "d3") {
    if (t.includes("pie") || c.includes("d3.arc") || c.includes("pie")) {
      return {
        name: "Pie Chart",
        icon: PieChart,
        colorClass: "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400"
      };
    }
    if (t.includes("network") || t.includes("graph") || c.includes("forcesimulation") || c.includes("link")) {
      return {
        name: "Network",
        icon: Network,
        colorClass: "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400"
      };
    }
    return {
      name: "Bar Chart",
      icon: BarChart3,
      colorClass: "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400"
    };
  }

  if (r === "mermaid") {
    if (t.includes("sequence") || c.includes("sequencediagram")) {
      return {
        name: "Sequence",
        icon: Clock,
        colorClass: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
      };
    }
    return {
      name: "Flowchart",
      icon: Network,
      colorClass: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
    };
  }

  if (r === "svg") {
    if (t.includes("diagram") || t.includes("flow") || t.includes("chart")) {
      return {
        name: "Diagram",
        icon: GitFork,
        colorClass: "bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400"
      };
    }
    return {
      name: "Logo",
      icon: Shapes,
      colorClass: "bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400"
    };
  }

  // default to p5
  if (t.includes("game") || t.includes("play") || t.includes("interactive") || c.includes("keypressed") || c.includes("mouseclicked") || c.includes("game")) {
    return {
      name: "Game",
      icon: Play,
      colorClass: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400"
    };
  }
  if (t.includes("pattern") || t.includes("wave") || t.includes("grid") || t.includes("gradient") || c.includes("sin(") || c.includes("cos(")) {
    return {
      name: "Pattern",
      icon: Code,
      colorClass: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400"
    };
  }
  if (t.includes("animation") || t.includes("bouncing") || t.includes("particle") || c.includes("framecount") || c.includes("framerate")) {
    return {
      name: "Animation",
      icon: Film,
      colorClass: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400"
    };
  }
  if (t.includes("art") || t.includes("fractal") || t.includes("generative") || c.includes("random") || c.includes("noise")) {
    return {
      name: "Art",
      icon: Image,
      colorClass: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400"
    };
  }

  return {
    name: "Canvas",
    icon: Layout,
    colorClass: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400"
  };
};

const GenesisApp = () => {
  const chatStore = useChatStore();
  const { user, initialize: initializeAuth, signOut: handleSignOut } = useAuthStore();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const { preferences } = useSettingsStore();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [greeting, setGreeting] = useState("Welcome back");
  const [currentView, setCurrentView] = useState("home");
  const [messages, setMessages] = useState<
    { type: string; content: string; images?: string[] }[]
  >([]);
  const [inputMessage, setInputMessage] = useState("");
  const [activeTab, setActiveTab] = useState("preview");
  const [p5Code, setP5Code] = useState<string>("");
  const [editableCode, setEditableCode] = useState<string>("");
  const [activeRenderer, setActiveRenderer] = useState<RendererType>("p5");
  const [isLoading, setIsLoading] = useState(false);
  const [showArtifact, setShowArtifact] = useState(false);
  const [isArtifactFullscreen, setIsArtifactFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previousCode, setPreviousCode] = useState<string>("");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const artifacts = hydrated ? chatStore.artifacts : [];
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [isMultiSelectChats, setIsMultiSelectChats] = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);
  const [isMobileTemplatesOpen, setIsMobileTemplatesOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // States for version system
  const [codeVersions, setCodeVersions] = useState<
    {
      code: string;
      renderer: RendererType;
      messageIndex: number;
      versionNumber: number;
    }[]
  >([]);
  const [activeVersionNumber, setActiveVersionNumber] = useState<number | null>(
    null,
  );
  const [isVersionDropdownOpen, setIsVersionDropdownOpen] = useState(false);

  // States for projects system
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [movingChatId, setMovingChatId] = useState<string | null>(null);
  const [isMoveToProjectOpen, setIsMoveToProjectOpen] = useState(false);
  const [chatMenuOpenId, setChatMenuOpenId] = useState<string | null>(null);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileChatInput, setShowMobileChatInput] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState<string>("");
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setRegeneratingId(null);
    }
  };

  // States for model selection
  const [selectedModel, setSelectedModel] = useState<AIModel>("gemini-3-flash");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  // States for download options & recording
  const [isDownloadDropdownOpen, setIsDownloadDropdownOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const downloadDropdownRef = useRef<HTMLDivElement>(null);
  const [showDownloadSettings, setShowDownloadSettings] = useState(false);
  const [downloadSettings, setDownloadSettings] = useState({
    videoDuration: 10, // seconds
    videoFps: 30, // 30 or 60
  });

  // Load download settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("genesis_download_settings");
    if (saved) {
      try {
        setDownloadSettings(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const updateDownloadSettings = (newSettings: Partial<typeof downloadSettings>) => {
    setDownloadSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem("genesis_download_settings", JSON.stringify(updated));
      return updated;
    });
  };

  // States for file upload
  const [attachedImages, setAttachedImages] = useState<ImageAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  // Zoom & Pan & Fullscreen States
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panMode, setPanMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const previewViewportRef = useRef<HTMLDivElement>(null);
  const previewPanelRef = useRef<HTMLDivElement>(null);
  const [isTrueFullscreen, setIsTrueFullscreen] = useState(false);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 4));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.25));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!panMode) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !panMode) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!panMode || e.touches.length !== 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    panStartRef.current = { ...pan };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !panMode || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const toggleTrueFullscreen = () => {
    if (!previewPanelRef.current) return;
    if (!document.fullscreenElement) {
      previewPanelRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsTrueFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Wheel zoom effect
  useEffect(() => {
    const viewport = previewViewportRef.current;
    if (!viewport) return;

    const preventZoom = (e: WheelEvent) => {
      if (e.ctrlKey || panMode) {
        e.preventDefault();
        const scaleFactor = 0.05;
        const direction = e.deltaY < 0 ? 1 : -1;
        setZoom((prev) =>
          Math.max(0.25, Math.min(prev + direction * scaleFactor, 4)),
        );
      }
    };

    viewport.addEventListener("wheel", preventZoom, { passive: false });
    return () => {
      viewport.removeEventListener("wheel", preventZoom);
    };
  }, [panMode]);

  // Reset zoom on chat/renderer change
  useEffect(() => {
    handleResetZoom();
  }, [activeChatId, activeRenderer]);

  // Reset tab to preview if developerMode is turned off
  useEffect(() => {
    if (!preferences.developerMode && activeTab !== "preview") {
      setActiveTab("preview");
    }
  }, [preferences.developerMode, activeTab]);

  const getFriendlyTitle = () => {
    const activeChat = chatStore.chats.find((c) => c.id === activeChatId);
    if (activeChat && activeChat.title && activeChat.title !== "New Chat") {
      return activeChat.title;
    }
    switch (activeRenderer) {
      case "svg":
        return "SVG Illustration";
      case "mermaid":
        return "Flowchart Diagram";
      case "d3":
        return "Interactive Visualization";
      default:
        return "Generative Canvas";
    }
  };

  // Helper to extract all versions from current messages
  const getVersionsFromMessages = (
    msgs: { type: string; content: string; images?: string[] }[],
  ) => {
    const list: {
      code: string;
      renderer: RendererType;
      messageIndex: number;
      versionNumber: number;
    }[] = [];
    let versionCounter = 1;
    msgs.forEach((msg, idx) => {
      if (msg.type === "ai") {
        const extracted = extractCode(msg.content);
        if (extracted) {
          list.push({
            code: extracted.code,
            renderer: extracted.renderer,
            messageIndex: idx,
            versionNumber: versionCounter++,
          });
        }
      }
    });
    return list;
  };

  useEffect(() => {
    const extractedVersions = getVersionsFromMessages(messages);

    // Check if the number of versions changed
    const versionCountChanged =
      extractedVersions.length !== codeVersions.length;

    // Check if any specific version's code changed (e.g., via pagination or inline edit)
    let changedVersionNumber: number | null = null;
    if (extractedVersions.length === codeVersions.length) {
      for (let i = 0; i < extractedVersions.length; i++) {
        if (
          !codeVersions[i] ||
          extractedVersions[i].code !== codeVersions[i].code
        ) {
          changedVersionNumber = extractedVersions[i].versionNumber;
          break;
        }
      }
    }

    setCodeVersions(extractedVersions);

    if (extractedVersions.length > 0) {
      if (versionCountChanged) {
        // Automatically switch to the latest version when a new version is added or removed
        setActiveVersionNumber(
          extractedVersions[extractedVersions.length - 1].versionNumber,
        );
      } else if (changedVersionNumber !== null) {
        // If a specific version was updated, select that version
        setActiveVersionNumber(changedVersionNumber);
      } else {
        // Otherwise, keep the current active version if it still exists
        setActiveVersionNumber((prev) => {
          if (
            prev !== null &&
            extractedVersions.some((v) => v.versionNumber === prev)
          ) {
            return prev;
          }
          return extractedVersions[extractedVersions.length - 1].versionNumber;
        });
      }
    } else {
      setActiveVersionNumber(null);
    }
  }, [messages]);

  useEffect(() => {
    if (activeVersionNumber !== null && codeVersions.length > 0) {
      const activeVer = codeVersions.find(
        (v) => v.versionNumber === activeVersionNumber,
      );
      if (activeVer) {
        setP5Code(activeVer.code);
        setEditableCode(activeVer.code);
        setActiveRenderer(activeVer.renderer);

        // Find previous version code
        const prevVer = codeVersions.find(
          (v) => v.versionNumber === activeVersionNumber - 1,
        );
        setPreviousCode(prevVer ? prevVer.code : "");
      }
    }
  }, [activeVersionNumber, codeVersions]);

  // Set greeting based on time of day
  useEffect(() => {
    const hrs = new Date().getHours();
    if (hrs < 12) setGreeting("Good morning");
    else if (hrs < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // Detect mobile viewport size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-fullscreen on mobile when preview is opened
  useEffect(() => {
    if (showArtifact && isMobile) {
      setIsArtifactFullscreen(true);
    }
  }, [showArtifact, isMobile]);

  // Hydration guard + seed dummy data on first load + migrate old artifacts
  useEffect(() => {
    setHydrated(true);

    // Migrate old artifacts if they exist
    if (typeof window !== "undefined") {
      try {
        const oldStored = localStorage.getItem("genesis-artifacts");
        if (oldStored) {
          const parsed = JSON.parse(oldStored);
          if (parsed && parsed.length > 0) {
            parsed.forEach((art: any) => {
              const exists = chatStore.artifacts.some(
                (a) => a.chatId === art.chatId && a.renderer === art.renderer,
              );
              if (!exists) {
                chatStore.addArtifact({
                  chatId: art.chatId,
                  chatTitle: art.chatTitle,
                  code: art.code,
                  renderer: art.renderer,
                });
              }
            });
          }
          localStorage.removeItem("genesis-artifacts");
        }
      } catch (err) {
        console.error("Failed to migrate artifacts:", err);
      }
    }

    // Seed dummy chats if store is empty
    if (chatStore.chats.length === 0) {
      const dummyChats = [
        {
          title: "Bouncing Ball Animation",
          userMsg: "Create a bouncing ball animation",
          aiMsg:
            "Here's a bouncing ball animation!\n\n```javascript\nlet x, y, xSpeed, ySpeed;\n\nfunction setup() {\n  createCanvas(400, 400);\n  x = 200; y = 200;\n  xSpeed = 3; ySpeed = 2;\n}\n\nfunction draw() {\n  background(30, 30, 50);\n  x += xSpeed; y += ySpeed;\n  if (x > width - 20 || x < 20) xSpeed *= -1;\n  if (y > height - 20 || y < 20) ySpeed *= -1;\n  fill(255, 100, 150);\n  noStroke();\n  ellipse(x, y, 40, 40);\n}\n```",
          code: "let x, y, xSpeed, ySpeed;\n\nfunction setup() {\n  createCanvas(400, 400);\n  x = 200; y = 200;\n  xSpeed = 3; ySpeed = 2;\n}\n\nfunction draw() {\n  background(30, 30, 50);\n  x += xSpeed; y += ySpeed;\n  if (x > width - 20 || x < 20) xSpeed *= -1;\n  if (y > height - 20 || y < 20) ySpeed *= -1;\n  fill(255, 100, 150);\n  noStroke();\n  ellipse(x, y, 40, 40);\n}",
          ago: 2 * 60 * 60 * 1000,
        },
        {
          title: "Particle System",
          userMsg: "Create a particle system with colorful particles",
          aiMsg:
            "Here's a particle system!\n\n```javascript\nlet particles = [];\n\nfunction setup() {\n  createCanvas(400, 400);\n}\n\nfunction draw() {\n  background(20, 20, 40, 25);\n  particles.push({x: mouseX, y: mouseY, vx: random(-2,2), vy: random(-2,2), life: 255, col: [random(255), random(255), random(255)]});\n  for (let i = particles.length - 1; i >= 0; i--) {\n    let p = particles[i];\n    p.x += p.vx; p.y += p.vy; p.life -= 3;\n    fill(p.col[0], p.col[1], p.col[2], p.life);\n    noStroke();\n    ellipse(p.x, p.y, 8);\n    if (p.life <= 0) particles.splice(i, 1);\n  }\n}\n```",
          code: "let particles = [];\n\nfunction setup() {\n  createCanvas(400, 400);\n}\n\nfunction draw() {\n  background(20, 20, 40, 25);\n  particles.push({x: mouseX, y: mouseY, vx: random(-2,2), vy: random(-2,2), life: 255, col: [random(255), random(255), random(255)]});\n  for (let i = particles.length - 1; i >= 0; i--) {\n    let p = particles[i];\n    p.x += p.vx; p.y += p.vy; p.life -= 3;\n    fill(p.col[0], p.col[1], p.col[2], p.life);\n    noStroke();\n    ellipse(p.x, p.y, 8);\n    if (p.life <= 0) particles.splice(i, 1);\n  }\n}",
          ago: 24 * 60 * 60 * 1000,
        },
        {
          title: "Fractal Tree",
          userMsg: "Create a fractal tree",
          aiMsg:
            "Here's a fractal tree!\n\n```javascript\nlet angle;\n\nfunction setup() {\n  createCanvas(400, 400);\n}\n\nfunction draw() {\n  background(30);\n  angle = map(mouseX, 0, width, 0, PI/3);\n  stroke(255);\n  translate(200, height);\n  branch(100);\n}\n\nfunction branch(len) {\n  strokeWeight(map(len, 0, 100, 1, 4));\n  stroke(map(len, 0, 100, 100, 255), 200, 100);\n  line(0, 0, 0, -len);\n  translate(0, -len);\n  if (len > 4) {\n    push(); rotate(angle); branch(len * 0.67); pop();\n    push(); rotate(-angle); branch(len * 0.67); pop();\n  }\n}\n```",
          code: "let angle;\n\nfunction setup() {\n  createCanvas(400, 400);\n}\n\nfunction draw() {\n  background(30);\n  angle = map(mouseX, 0, width, 0, PI/3);\n  stroke(255);\n  translate(200, height);\n  branch(100);\n}\n\nfunction branch(len) {\n  strokeWeight(map(len, 0, 100, 1, 4));\n  stroke(map(len, 0, 100, 100, 255), 200, 100);\n  line(0, 0, 0, -len);\n  translate(0, -len);\n  if (len > 4) {\n    push(); rotate(angle); branch(len * 0.67); pop();\n    push(); rotate(-angle); branch(len * 0.67); pop();\n  }\n}",
          ago: 2 * 24 * 60 * 60 * 1000,
        },
        {
          title: "Wave Pattern",
          userMsg: "Create a wave pattern animation",
          aiMsg:
            "Here's a wave pattern!\n\n```javascript\nfunction setup() {\n  createCanvas(400, 400);\n}\n\nfunction draw() {\n  background(10, 10, 30);\n  noFill();\n  for (let j = 0; j < 10; j++) {\n    stroke(100 + j * 15, 100, 255 - j * 20, 180);\n    strokeWeight(2);\n    beginShape();\n    for (let x = 0; x < width; x += 5) {\n      let y = 200 + sin(x * 0.02 + frameCount * 0.03 + j * 0.5) * (40 + j * 8);\n      vertex(x, y);\n    }\n    endShape();\n  }\n}\n```",
          code: "function setup() {\n  createCanvas(400, 400);\n}\n\nfunction draw() {\n  background(10, 10, 30);\n  noFill();\n  for (let j = 0; j < 10; j++) {\n    stroke(100 + j * 15, 100, 255 - j * 20, 180);\n    strokeWeight(2);\n    beginShape();\n    for (let x = 0; x < width; x += 5) {\n      let y = 200 + sin(x * 0.02 + frameCount * 0.03 + j * 0.5) * (40 + j * 8);\n      vertex(x, y);\n    }\n    endShape();\n  }\n}",
          ago: 3 * 24 * 60 * 60 * 1000,
        },
        {
          title: "Color Gradient",
          userMsg: "Create a dynamic color gradient",
          aiMsg:
            "Here's a color gradient!\n\n```javascript\nfunction setup() {\n  createCanvas(400, 400);\n  noStroke();\n}\n\nfunction draw() {\n  for (let y = 0; y < height; y++) {\n    let r = map(sin(y * 0.01 + frameCount * 0.02), -1, 1, 50, 255);\n    let g = map(cos(y * 0.015 + frameCount * 0.01), -1, 1, 50, 200);\n    let b = map(sin(y * 0.02 + frameCount * 0.03), -1, 1, 100, 255);\n    stroke(r, g, b);\n    line(0, y, width, y);\n  }\n}\n```",
          code: "function setup() {\n  createCanvas(400, 400);\n  noStroke();\n}\n\nfunction draw() {\n  for (let y = 0; y < height; y++) {\n    let r = map(sin(y * 0.01 + frameCount * 0.02), -1, 1, 50, 255);\n    let g = map(cos(y * 0.015 + frameCount * 0.01), -1, 1, 50, 200);\n    let b = map(sin(y * 0.02 + frameCount * 0.03), -1, 1, 100, 255);\n    stroke(r, g, b);\n    line(0, y, width, y);\n  }\n}",
          ago: 7 * 24 * 60 * 60 * 1000,
        },
        {
          title: "Monthly Sales Chart",
          userMsg: "Create a bar chart showing monthly sales data using D3.js",
          aiMsg:
            'Here\'s a bar chart with D3.js!\n\n```javascript\n// renderer: d3\nconst data = [\n  { month: \"Jan\", sales: 65 }, { month: \"Feb\", sales: 59 },\n  { month: \"Mar\", sales: 80 }, { month: \"Apr\", sales: 81 },\n  { month: \"May\", sales: 56 }, { month: \"Jun\", sales: 95 },\n];\nconst margin = { top: 40, right: 30, bottom: 50, left: 60 };\nconst width = window.innerWidth - margin.left - margin.right;\nconst height = window.innerHeight - margin.top - margin.bottom;\nconst svg = d3.select(\"#chart\").append(\"svg\").attr(\"width\", width + margin.left + margin.right).attr(\"height\", height + margin.top + margin.bottom).append(\"g\").attr(\"transform\", `translate(${margin.left},${margin.top})`);\nconst x = d3.scaleBand().domain(data.map(d => d.month)).range([0, width]).padding(0.3);\nconst y = d3.scaleLinear().domain([0, d3.max(data, d => d.sales)]).nice().range([height, 0]);\nsvg.append(\"g\").attr(\"transform\", `translate(0,${height})`).call(d3.axisBottom(x)).selectAll(\"text\").style(\"fill\", \"#ccc\");\nsvg.append(\"g\").call(d3.axisLeft(y)).selectAll(\"text\").style(\"fill\", \"#ccc\");\nconst color = d3.scaleOrdinal(d3.schemeTableau10);\nsvg.selectAll(\".bar\").data(data).enter().append(\"rect\").attr(\"x\", d => x(d.month)).attr(\"width\", x.bandwidth()).attr(\"y\", height).attr(\"height\", 0).attr(\"fill\", (d, i) => color(i)).attr(\"rx\", 4).transition().duration(800).delay((d, i) => i * 100).attr(\"y\", d => y(d.sales)).attr(\"height\", d => height - y(d.sales));\nsvg.append(\"text\").attr(\"x\", width / 2).attr(\"y\", -10).attr(\"text-anchor\", \"middle\").style(\"fill\", \"#eee\").style(\"font-size\", \"16px\").text(\"Monthly Sales 2025\");\n```',
          code: '// renderer: d3\nconst data = [\n  { month: "Jan", sales: 65 }, { month: "Feb", sales: 59 },\n  { month: "Mar", sales: 80 }, { month: "Apr", sales: 81 },\n  { month: "May", sales: 56 }, { month: "Jun", sales: 95 },\n];\nconst margin = { top: 40, right: 30, bottom: 50, left: 60 };\nconst width = window.innerWidth - margin.left - margin.right;\nconst height = window.innerHeight - margin.top - margin.bottom;\nconst svg = d3.select("#chart").append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", `translate(${margin.left},${margin.top})`);\nconst x = d3.scaleBand().domain(data.map(d => d.month)).range([0, width]).padding(0.3);\nconst y = d3.scaleLinear().domain([0, d3.max(data, d => d.sales)]).nice().range([height, 0]);\nsvg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x)).selectAll("text").style("fill", "#ccc");\nsvg.append("g").call(d3.axisLeft(y)).selectAll("text").style("fill", "#ccc");\nconst color = d3.scaleOrdinal(d3.schemeTableau10);\nsvg.selectAll(".bar").data(data).enter().append("rect").attr("x", d => x(d.month)).attr("width", x.bandwidth()).attr("y", height).attr("height", 0).attr("fill", (d, i) => color(i)).attr("rx", 4).transition().duration(800).delay((d, i) => i * 100).attr("y", d => y(d.sales)).attr("height", d => height - y(d.sales));\nsvg.append("text").attr("x", width / 2).attr("y", -10).attr("text-anchor", "middle").style("fill", "#eee").style("font-size", "16px").text("Monthly Sales 2025");',
          ago: 5 * 24 * 60 * 60 * 1000,
        },
      ];

      dummyChats.forEach((dc) => {
        const chatId = chatStore.createChat(dc.title);
        chatStore.addMessage(chatId, {
          role: "user",
          content: dc.userMsg,
          tokens: Math.ceil(dc.userMsg.length / 4),
        });
        chatStore.addMessage(chatId, {
          role: "assistant",
          content: dc.aiMsg,
          tokens: Math.ceil(dc.aiMsg.length / 4),
        });

        // Detect renderer from code
        const renderer: RendererType = dc.code.startsWith("// renderer: d3")
          ? "d3"
          : dc.code.startsWith("// renderer: svg")
            ? "svg"
            : dc.code.startsWith("// renderer: mermaid")
              ? "mermaid"
              : "p5";

        chatStore.addArtifact({
          chatId,
          chatTitle: dc.title,
          code: dc.code,
          renderer,
        });
      });
    }
  }, []);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const creationTools = [
    // p5.js templates
    {
      name: "Canvas",
      icon: Layout,
      prompt: "Create a colorful animated canvas",
    },
    { name: "Animation", icon: Film, prompt: "Create a smooth animation" },
    { name: "Art", icon: Image, prompt: "Create generative art" },
    { name: "Game", icon: Play, prompt: "Create a simple interactive game" },
    { name: "Pattern", icon: Code, prompt: "Create a mesmerizing pattern" },
    // D3.js templates
    {
      name: "Bar Chart",
      icon: BarChart3,
      prompt:
        "Create an interactive bar chart with sample sales data using D3.js",
    },
    {
      name: "Network",
      icon: Network,
      prompt: "Create a force-directed network graph using D3.js",
    },
    {
      name: "Pie Chart",
      icon: PieChart,
      prompt: "Create an animated pie chart with sample data using D3.js",
    },
    // SVG templates
    {
      name: "Logo",
      icon: Shapes,
      prompt: "Create a modern, minimalist logo design using SVG",
    },
    {
      name: "Diagram",
      icon: GitFork,
      prompt: "Create a simple flowchart diagram using SVG",
    },
    {
      name: "Flowchart",
      icon: Network,
      prompt:
        "Create a professional flowchart using Mermaid.js showing a business process",
    },
    {
      name: "Sequence",
      icon: Clock,
      prompt:
        "Create a sequence diagram using Mermaid.js for a system interaction",
    },
  ];

  const addArtifact = (
    chatId: string,
    chatTitle: string,
    code: string,
    renderer: RendererType = "p5",
  ) => {
    const existing = chatStore.artifacts.find(
      (a) => a.chatId === chatId && a.renderer === renderer,
    );
    if (existing) {
      chatStore.deleteArtifact(existing.id);
    }
    chatStore.addArtifact({
      chatId,
      chatTitle,
      code,
      renderer,
    });
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modelDropdownRef.current &&
        !modelDropdownRef.current.contains(event.target as Node)
      ) {
        setIsModelDropdownOpen(false);
      }
      if (
        downloadDropdownRef.current &&
        !downloadDropdownRef.current.contains(event.target as Node)
      ) {
        setIsDownloadDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // File upload handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const validFiles = files.filter((file) => {
      if (!FILE_UPLOAD_CONFIG.acceptedTypes.includes(file.type)) {
        alert(`${file.name} is not a supported image format`);
        return false;
      }
      if (file.size > FILE_UPLOAD_CONFIG.maxSize) {
        alert(`${file.name} exceeds the maximum size of 10MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;
    if (
      attachedImages.length + validFiles.length >
      FILE_UPLOAD_CONFIG.maxFiles
    ) {
      alert(`You can only upload up to ${FILE_UPLOAD_CONFIG.maxFiles} images`);
      return;
    }

    setIsUploading(true);

    try {
      const newImages: ImageAttachment[] = [];
      for (const file of validFiles) {
        // Always create local data URL first for instant preview
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.readAsDataURL(file);
        });

        // Use data URL as both preview and url (for sending to Gemini as inlineData)
        newImages.push({
          id: `${Date.now()}-${Math.random()}`,
          url: dataUrl,
          name: file.name,
          size: file.size,
          type: file.type,
          preview: dataUrl,
        });
      }
      setAttachedImages((prev) => [...prev, ...newImages]);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeAttachedImage = (imageId: string) => {
    setAttachedImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const messageToSend = customPrompt || inputMessage;
    if (!messageToSend.trim() && attachedImages.length === 0) return;

    // Keep user message as plain text (no base64 appended)
    const userMessage = messageToSend;
    const currentImages = [...attachedImages];

    // Collect image preview URLs to show inline in chat
    const imagePreviewUrls = currentImages.map((img) => img.preview || img.url);

    const newMessages = [
      ...messages,
      {
        type: "user",
        content: userMessage,
        images: imagePreviewUrls.length > 0 ? imagePreviewUrls : undefined,
      },
    ];
    setMessages(newMessages);
    setInputMessage("");
    setAttachedImages([]);
    setIsLoading(true);
    setCurrentView("chat");
    setShowArtifact(false);

    // Create chat in store if this is a new conversation
    let chatId = activeChatId;
    if (!chatId) {
      const title =
        userMessage.length > 40
          ? userMessage.substring(0, 40) + "..."
          : userMessage;
      chatId = chatStore.createChat(title);
      if (activeProjectId) {
        chatStore.moveToProject(chatId, activeProjectId);
      }
      chatStore.updateModelConfig(chatId, { model: selectedModel });
      setActiveChatId(chatId);
    }

    // Save user message to store
    chatStore.addMessage(chatId, {
      role: "user",
      content: userMessage,
      tokens: Math.ceil(userMessage.length / 4),
    });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Build images array for API — extract base64 data from data URLs
      const imagePayloads = currentImages.map((img) => {
        const url = img.url;
        if (url.startsWith("data:")) {
          // Extract mime type and base64 data from data URL
          const match = url.match(/^data:(image\/\w+);base64,(.+)$/);
          if (match) {
            return { mimeType: match[1], base64: match[2] };
          }
        }
        // For remote URLs, pass as-is
        return { url };
      });

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: newMessages.map((msg) => ({
            role: msg.type === "user" ? "user" : "assistant",
            content: msg.content,
          })),
          model: selectedModel,
          currentCode: editableCode || "",
          images: imagePayloads.length > 0 ? imagePayloads : undefined,
        }),
      });

      const data = await response.json();

      if (data.error) {
        const errContent = `Error: ${data.error}`;
        setMessages((prev) => [...prev, { type: "ai", content: errContent }]);
        chatStore.addMessage(chatId, {
          role: "assistant",
          content: errContent,
          tokens: 10,
        });
      } else {
        const aiContent = data.message?.content || "No response received";
        setMessages((prev) => [...prev, { type: "ai", content: aiContent }]);
        chatStore.addMessage(chatId, {
          role: "assistant",
          content: aiContent,
          tokens: Math.ceil(aiContent.length / 4),
        });

        const extracted = extractCode(aiContent);
        if (extracted) {
          if (p5Code) setPreviousCode(p5Code);
          setP5Code(extracted.code);
          setEditableCode(extracted.code);
          setActiveRenderer(extracted.renderer);
          setActiveTab("preview");
          setShowArtifact(true);

          // Save as artifact
          const chat = chatStore.chats.find((c) => c.id === chatId);
          addArtifact(
            chatId,
            chat?.title || "Untitled",
            extracted.code,
            extracted.renderer,
          );
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        const stopMsg = "Generation stopped.";
        setMessages((prev) => [...prev, { type: "ai", content: stopMsg }]);
        chatStore.addMessage(chatId, {
          role: "assistant",
          content: stopMsg,
          tokens: 0,
        });
      } else {
        const errMsg = "Failed to connect to AI service. Please try again.";
        chatStore.addMessage(chatId, {
          role: "assistant",
          content: errMsg,
          tokens: 10,
        });
      }
      syncMessagesFromStore(chatId);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleRunCode = () => {
    setP5Code(editableCode);
    setActiveTab("preview");
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(p5Code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCode = () => {
    const element = document.createElement("a");
    const file = new Blob([p5Code], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    let filename = "canvas.js";
    if (activeRenderer === "svg") filename = "illustration.svg";
    else if (activeRenderer === "mermaid") filename = "diagram.mmd";
    else if (activeRenderer === "d3") filename = "visualization.js";
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadImage = () => {
    setIsDownloadDropdownOpen(false);
    const iframe = previewViewportRef.current?.querySelector("iframe");
    if (iframe?.contentWindow) {
      toast({
        title: "Generating Image",
        description: "Exporting canvas to PNG...",
      });
      iframe.contentWindow.postMessage("downloadCanvas", "*");
    } else {
      toast({
        title: "Export Failed",
        description: "Preview not ready or not loaded.",
        variant: "destructive",
      });
    }
  };

  const handleStartRecording = () => {
    setIsDownloadDropdownOpen(false);
    const iframe = previewViewportRef.current?.querySelector("iframe");
    if (iframe?.contentWindow) {
      if (activeRenderer !== "p5") {
        toast({
          title: "Video Recording",
          description: "Video recording is only supported for p5.js animations.",
          variant: "destructive",
        });
        return;
      }
      iframe.contentWindow.postMessage(
        {
          type: "startRecording",
          fps: downloadSettings.videoFps,
        },
        "*"
      );
    } else {
      toast({
        title: "Recording Failed",
        description: "Preview not ready or not loaded.",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = () => {
    const iframe = previewViewportRef.current?.querySelector("iframe");
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage("stopRecording", "*");
    }
  };

  // Message listener for canvas data and video data from iframes
  useEffect(() => {
    let recordingInterval: any;
    
    const handleMessage = (event: MessageEvent) => {
      // 1. Handle Canvas Image Data
      if (event.data?.type === "canvasData") {
        if (event.data.dataURL) {
          const link = document.createElement("a");
          let filename = `genesis-${activeRenderer}-${Date.now()}.png`;
          link.download = filename;
          link.href = event.data.dataURL;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast({
            title: "Image Downloaded",
            description: `Successfully exported to ${filename}`,
          });
        } else {
          toast({
            title: "Download Failed",
            description: "Could not export canvas data.",
            variant: "destructive",
          });
        }
      }
      
      // 2. Handle Video Recording Status
      if (event.data?.type === "recordingStatus") {
        if (event.data.status === "started") {
          setIsRecording(true);
          setRecordingProgress(0);
          
          toast({
            title: "Recording Started",
            description: `Capturing p5.js canvas animation at ${downloadSettings.videoFps} FPS...`,
          });

          // Increment recording progress timer
          let seconds = 0;
          recordingInterval = setInterval(() => {
            seconds += 1;
            setRecordingProgress(seconds);
            if (seconds >= downloadSettings.videoDuration) { // Limit to custom duration
              clearInterval(recordingInterval);
              handleStopRecording();
            }
          }, 1000);
        }
      }
      
      // 3. Handle Video Recording Error
      if (event.data?.type === "recordingError") {
        setIsRecording(false);
        if (recordingInterval) clearInterval(recordingInterval);
        toast({
          title: "Recording Error",
          description: event.data.error || "An error occurred during recording.",
          variant: "destructive",
        });
      }
      
      // 4. Handle Video Data Result
      if (event.data?.type === "videoData" && event.data.dataURL) {
        setIsRecording(false);
        if (recordingInterval) clearInterval(recordingInterval);
        
        const link = document.createElement("a");
        const filename = `genesis-animation-${Date.now()}.webm`;
        link.download = filename;
        link.href = event.data.dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Video Downloaded",
          description: `Successfully saved video as ${filename}`,
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
      if (recordingInterval) clearInterval(recordingInterval);
    };
  }, [activeRenderer, toast, downloadSettings]);

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const syncMessagesFromStore = (chatId: string) => {
    const chat = chatStore.chats.find((c) => c.id === chatId);
    if (!chat) return;
    setMessages(
      chat.messages.map((msg) => ({
        type: msg.role === "user" ? "user" : "ai",
        content: msg.content,
      })),
    );
  };

  const handleSwitchHomeVersion = (messageId: string, versionIdx: number) => {
    if (activeChatId) {
      chatStore.switchMessageVersion(activeChatId, messageId, versionIdx);
      syncMessagesFromStore(activeChatId);
    }
  };

  const handleSaveHomeEdit = async (messageId: string, index: number) => {
    if (!activeChatId || !editingMessageText.trim()) return;

    // Update message in store
    chatStore.updateMessage(activeChatId, messageId, editingMessageText);

    // Simpan ID SEBELUM mutasi apapun
    const chat = chatStore.chats.find((c) => c.id === activeChatId);
    let assistantMessageId = "";
    if (chat) {
      const nextIdx = index + 1;
      if (
        nextIdx < chat.messages.length &&
        chat.messages[nextIdx].role === "assistant"
      ) {
        assistantMessageId = chat.messages[nextIdx].id;
        // TIDAK dihapus — akan diupdate
      }
    }

    setEditingMessageId(null);

    // Sync local messages state
    syncMessagesFromStore(activeChatId);

    // Trigger regeneration
    setIsLoading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const updatedChat = chatStore.chats.find((c) => c.id === activeChatId);
      if (!updatedChat) return;
      const history = updatedChat.messages.slice(0, index + 1).map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      }));

      const hasCodeContext = history.some((m) =>
        m.content.includes("// renderer:"),
      );
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: history,
          model: updatedChat.modelConfig.model || "gemini-3-flash",
          currentCode: hasCodeContext ? editableCode || "" : "",
        }),
      });

      const data = await response.json();
      if (data.error) {
        const errContent = `Error: ${data.error}`;
        if (assistantMessageId) {
          chatStore.updateMessage(activeChatId, assistantMessageId, errContent);
        } else {
          chatStore.addMessage(activeChatId, {
            role: "assistant",
            content: errContent,
            tokens: 10,
          });
        }
        syncMessagesFromStore(activeChatId);
      } else {
        const aiContent = data.message?.content || "No response received";
        if (assistantMessageId) {
          chatStore.updateMessage(activeChatId, assistantMessageId, aiContent);
        } else {
          chatStore.addMessage(activeChatId, {
            role: "assistant",
            content: aiContent,
            tokens: Math.ceil(aiContent.length / 4),
          });
        }

        syncMessagesFromStore(activeChatId);

        // Update visualizer artifact if code was generated
        const extracted = extractCode(aiContent);
        if (extracted) {
          if (p5Code) setPreviousCode(p5Code);
          setP5Code(extracted.code);
          setEditableCode(extracted.code);
          setActiveRenderer(extracted.renderer);
          setActiveTab("preview");
          setShowArtifact(true);
          addArtifact(
            activeChatId,
            updatedChat.title || "Untitled",
            extracted.code,
            extracted.renderer,
          );
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        const stopMsg = "Generation stopped.";
        if (assistantMessageId) {
          chatStore.updateMessage(activeChatId, assistantMessageId, stopMsg);
        } else {
          chatStore.addMessage(activeChatId, {
            role: "assistant",
            content: stopMsg,
            tokens: 0,
          });
        }
      } else {
        const errMsg = "Failed to connect to AI service. Please try again.";
        if (assistantMessageId) {
          chatStore.updateMessage(activeChatId, assistantMessageId, errMsg);
        } else {
          chatStore.addMessage(activeChatId, {
            role: "assistant",
            content: errMsg,
            tokens: 10,
          });
        }
      }
      syncMessagesFromStore(activeChatId);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleRegenerateMessage = async (
    messageId: string,
    newModel?: string,
  ) => {
    if (!activeChatId) return;
    const chat = chatStore.chats.find((c) => c.id === activeChatId);
    if (!chat) return;

    const messageIndex = chat.messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) return;

    const message = chat.messages[messageIndex];
    const isAssistant = message.role === "assistant";

    let userMessageIndex = messageIndex;
    let assistantMessageId = "";

    if (isAssistant) {
      userMessageIndex = messageIndex - 1;
      assistantMessageId = messageId;
    } else {
      const assistantMessageIndex = messageIndex + 1;
      if (
        assistantMessageIndex < chat.messages.length &&
        chat.messages[assistantMessageIndex].role === "assistant"
      ) {
        assistantMessageId = chat.messages[assistantMessageIndex].id;
      }
    }

    if (userMessageIndex < 0) return;
    const userMessage = chat.messages[userMessageIndex];

    setRegeneratingId(messageId);
    setIsLoading(true);

    // Build context up to userMessageIndex
    const history = chat.messages.slice(0, userMessageIndex + 1).map((msg) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    }));

    const chatModel = chat.modelConfig.model;
    const modelToUse = newModel || chatModel || "gemini-3-flash";

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const hasCodeContext = history.some((m) =>
        m.content.includes("// renderer:"),
      );
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: history,
          model: modelToUse,
          currentCode: hasCodeContext ? editableCode || "" : "",
        }),
      });

      const data = await response.json();

      if (data.error) {
        const errContent = `Error: ${data.error}`;
        if (assistantMessageId) {
          chatStore.updateMessage(activeChatId, assistantMessageId, errContent);
        } else {
          chatStore.addMessage(activeChatId, {
            role: "assistant",
            content: errContent,
            tokens: 10,
          });
        }
        syncMessagesFromStore(activeChatId);
      } else {
        const aiContent = data.message?.content || "No response received";

        if (assistantMessageId) {
          // Update existing assistant message with new version
          chatStore.updateMessage(activeChatId, assistantMessageId, aiContent);
        } else {
          // If no assistant message existed, add one
          chatStore.addMessage(activeChatId, {
            role: "assistant",
            content: aiContent,
            tokens: Math.ceil(aiContent.length / 4),
          });
        }

        // Sync local messages state
        syncMessagesFromStore(activeChatId);

        // Update visualizer artifact if code was generated
        const extracted = extractCode(aiContent);
        if (extracted) {
          if (p5Code) setPreviousCode(p5Code);
          setP5Code(extracted.code);
          setEditableCode(extracted.code);
          setActiveRenderer(extracted.renderer);
          setActiveTab("preview");
          setShowArtifact(true);
          addArtifact(
            activeChatId,
            chat.title || "Untitled",
            extracted.code,
            extracted.renderer,
          );
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        const stopMsg = "Generation stopped.";
        if (assistantMessageId) {
          chatStore.updateMessage(activeChatId, assistantMessageId, stopMsg);
        } else {
          chatStore.addMessage(activeChatId, {
            role: "assistant",
            content: stopMsg,
            tokens: 0,
          });
        }
      } else {
        const errMsg = "Failed to connect to AI service. Please try again.";
        if (assistantMessageId) {
          chatStore.updateMessage(activeChatId, assistantMessageId, errMsg);
        } else {
          chatStore.addMessage(activeChatId, {
            role: "assistant",
            content: errMsg,
            tokens: 10,
          });
        }
      }
      syncMessagesFromStore(activeChatId);
    } finally {
      setIsLoading(false);
      setRegeneratingId(null);
      abortControllerRef.current = null;
    }
  };

  const renderAiMessage = (content: string, messageIndex: number) => {
    const codeRegex =
      /```(?:javascript|js|html|svg|mermaid|p5)?\n([\s\S]*?)```/g;
    const match = codeRegex.exec(content);

    if (match) {
      const textBefore = content.substring(0, match.index);
      const code = match[1];

      let type = "canvas.js";
      let fileIcon = <FileCode2 size={13} className="text-[#60aaff]" />;
      let rType: RendererType = "p5";
      if (code.includes("// renderer: d3")) {
        type = "visualization.js";
        rType = "d3";
      } else if (code.includes("// renderer: svg") || code.includes("<svg")) {
        type = "illustration.svg";
        rType = "svg";
      } else if (
        code.includes("// renderer: mermaid") ||
        code.includes("graph ") ||
        code.includes("flowchart ")
      ) {
        type = "diagram.mmd";
        rType = "mermaid";
      }

      // Find version number for this messageIndex
      const verObj = codeVersions.find((v) => v.messageIndex === messageIndex);
      const versionNum = verObj ? verObj.versionNumber : 1;

      return (
        <div className="flex flex-col gap-2.5">
          <style>{`
            .preview-in-chat button {
              display: none !important;
            }
          `}</style>
          {textBefore && (
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed text-left">
              <ReactMarkdown
                components={{
                  p: ({ node, ...props }) => (
                    <p className="mb-2 last:mb-0" {...props} />
                  ),
                  strong: ({ node, ...props }) => (
                    <strong
                      className="font-bold text-gray-900 dark:text-white"
                      {...props}
                    />
                  ),
                  em: ({ node, ...props }) => (
                    <em className="italic" {...props} />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul
                      className="list-disc pl-4 mb-2 space-y-1 text-left"
                      {...props}
                    />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol
                      className="list-decimal pl-4 mb-2 space-y-1 text-left"
                      {...props}
                    />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="text-sm" {...props} />
                  ),
                  code: ({ node, ...props }) => (
                    <code
                      className="bg-gray-100 dark:bg-white/10 px-1 py-0.5 rounded text-xs font-mono"
                      {...props}
                    />
                  ),
                }}
              >
                {textBefore}
              </ReactMarkdown>
            </div>
          )}

          <div
            onClick={() => {
              setShowArtifact(true);
              if (verObj) {
                setActiveVersionNumber(verObj.versionNumber);
              } else {
                setP5Code(code);
                setEditableCode(code);
                setActiveRenderer(rType);
              }
              setActiveTab("preview");
            }}
            className="border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#090514]/45 overflow-hidden text-gray-200 max-w-full font-mono text-[12px] cursor-pointer hover:border-[#60aaff]/35 transition-all shadow-md group/card relative"
          >
            {/* Visual Preview Container */}
            <div className="p-3 bg-white dark:bg-[#07030e]/30 rounded-xl overflow-hidden flex items-center justify-center min-h-[220px] max-h-[300px] relative select-none preview-in-chat">
              {rType === "d3" && (
                <D3Canvas code={code} width={380} height={200} />
              )}
              {rType === "svg" && (
                <SVGCanvas code={code} width={380} height={200} />
              )}
              {rType === "mermaid" && (
                <MermaidCanvas code={code} width={380} height={200} />
              )}
              {rType === "p5" && (
                <P5Canvas code={code} width={380} height={200} />
              )}

              {/* Floating Hover Maximize Button */}
              <div className="absolute top-3 right-3 opacity-0 group-hover/card:opacity-100 transition-all duration-200 z-10">
                <div className="p-1.5 bg-black/60 dark:bg-black/80 hover:bg-black/85 text-white rounded-lg border border-white/10 shadow-md backdrop-blur-md hover:scale-105 transition-transform">
                  <Maximize2 size={13} className="text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed text-left">
        <ReactMarkdown
          components={{
            p: ({ node, ...props }) => (
              <p className="mb-2 last:mb-0" {...props} />
            ),
            strong: ({ node, ...props }) => (
              <strong
                className="font-bold text-gray-900 dark:text-white"
                {...props}
              />
            ),
            em: ({ node, ...props }) => <em className="italic" {...props} />,
            ul: ({ node, ...props }) => (
              <ul
                className="list-disc pl-4 mb-2 space-y-1 text-left"
                {...props}
              />
            ),
            ol: ({ node, ...props }) => (
              <ol
                className="list-decimal pl-4 mb-2 space-y-1 text-left"
                {...props}
              />
            ),
            li: ({ node, ...props }) => <li className="text-sm" {...props} />,
            code: ({ node, ...props }) => (
              <code
                className="bg-gray-100 dark:bg-white/10 px-1 py-0.5 rounded text-xs font-mono"
                {...props}
              />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  const startNewChat = () => {
    setCurrentView("home");
    setActiveChatId(null);
    setMessages([]);
    setP5Code("");
    setEditableCode("");
    setPreviousCode("");
    setShowArtifact(false);
    setIsArtifactFullscreen(false);
    setCodeVersions([]);
    setActiveVersionNumber(null);
    setSelectedModel("gemini-3-flash");
    setAttachedImages([]);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const selectChat = (chatId: string, shouldShowArtifact = false) => {
    const chat = chatStore.chats.find((c) => c.id === chatId);
    if (!chat) return;

    setActiveChatId(chatId);
    setCurrentView("chat");

    // Restore model selection from chat config
    if (chat.modelConfig?.model) {
      setSelectedModel(chat.modelConfig.model);
    }

    // Rebuild messages from store
    const loadedMessages = chat.messages.map((msg) => ({
      type: msg.role === "user" ? "user" : "ai",
      content: msg.content,
    }));
    setMessages(loadedMessages);

    // Check if the chat conversation contains code
    let hasCode = false;
    for (const msg of chat.messages) {
      if (msg.role === "assistant" && extractCode(msg.content)) {
        hasCode = true;
        break;
      }
    }

    setShowArtifact(hasCode ? shouldShowArtifact : false);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const deleteChat = (chatId: string) => {
    chatStore.deleteChat(chatId);

    if (activeChatId === chatId) {
      startNewChat();
    }
  };

  const startRename = (chatId: string, currentTitle: string) => {
    setRenamingChatId(chatId);
    setRenameValue(currentTitle);
  };

  const confirmRename = () => {
    if (renamingChatId && renameValue.trim()) {
      chatStore.renameChat(renamingChatId, renameValue.trim());
      setRenamingChatId(null);
      setRenameValue("");
    }
  };

  const loadArtifactCode = (artifact: Artifact) => {
    selectChat(artifact.chatId, true);
    setActiveTab("preview");
  };

  const openGallery = () => {
    setCurrentView("gallery");
    setShowArtifact(false);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const deleteArtifact = (artifactId: string) => {
    chatStore.deleteArtifact(artifactId);
  };

  const sortedChats = hydrated
    ? [...chatStore.chats].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
    : [];

  return (
    <div className="flex h-[100dvh] bg-white dark:bg-[#000000] text-gray-900 dark:text-white relative overflow-hidden transition-colors duration-300">
      {/* Global hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept={FILE_UPLOAD_CONFIG.acceptedTypes.join(",")}
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      {/* Animated fluid gradient background for light mode (Tahoe) */}
      <div className="absolute inset-0 z-0 opacity-100 dark:opacity-0 transition-opacity duration-700 pointer-events-none theme-tahoe-light" />

      {/* Animated fluid gradient background for dark mode */}
      <div className="absolute inset-0 z-0 opacity-0 dark:opacity-100 transition-opacity duration-700 pointer-events-none theme-claude-gradient" />

      {/* Sidebar Overlay Backdrop for Mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-20 animate-fade-in"
        />
      )}

      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "w-64 absolute md:relative z-30 shadow-2xl md:shadow-none h-full" : "hidden md:flex w-14 z-20"} transition-all duration-300 sidebar-panel overflow-hidden flex-shrink-0 flex flex-col`}
      >
        {sidebarOpen ? (
          /* Expanded Sidebar */
          <div className="p-4 w-64 flex flex-col h-full animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-full h-full"
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient
                        id="genesisGradSidebar"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="50%" stopColor="#60aaff" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M26 16C26 21.5228 21.5228 26 16 26C10.4772 26 6 21.5228 6 16C6 10.4772 10.4772 6 16 6C19.3431 6 22.2868 7.6393 24.1002 10.1584"
                      stroke="url(#genesisGradSidebar)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M16 16H25"
                      stroke="url(#genesisGradSidebar)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M16 11L17.5 14.5L21 16L17.5 17.5L16 21L14.5 17.5L11 16L14.5 14.5L16 11Z"
                      fill="url(#genesisGradSidebar)"
                    />
                  </svg>
                </div>
                <span className="font-semibold text-lg text-gray-900 dark:text-white">
                  Genesis
                </span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Collapse sidebar"
              >
                <PanelLeft size={18} />
              </button>
            </div>

            {/* Navigation */}
            <div className="space-y-1 mb-4">
              <button
                onClick={startNewChat}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-[#1a6adf] hover:bg-[#1a6adf]/90 dark:bg-white text-white dark:text-black dark:hover:bg-gray-100 transition-colors text-sm font-medium shadow-sm cursor-pointer"
              >
                <SquarePen size={18} />
                <span>New chat</span>
              </button>

              <button
                onClick={() => {
                  setCurrentView("chats");
                  setActiveChatId(null);
                  if (
                    typeof window !== "undefined" &&
                    window.innerWidth < 768
                  ) {
                    setSidebarOpen(false);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm cursor-pointer ${currentView === "chats" || currentView === "chat" ? "bg-[#1a6adf]/18 dark:bg-white/10 font-medium text-[#0a1628] dark:text-white shadow-sm" : "text-[#3a6aaa] hover:text-[#0a1628] hover:bg-[#1a6adf]/14 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/5"}`}
              >
                <MessageSquare size={18} />
                <span>Chats</span>
              </button>

              <button
                onClick={() => {
                  setCurrentView("projects");
                  setActiveProjectId(null);
                  if (
                    typeof window !== "undefined" &&
                    window.innerWidth < 768
                  ) {
                    setSidebarOpen(false);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm cursor-pointer ${currentView === "projects" ? "bg-[#1a6adf]/18 dark:bg-white/10 font-medium text-[#0a1628] dark:text-white shadow-sm" : "text-[#3a6aaa] hover:text-[#0a1628] hover:bg-[#1a6adf]/14 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/5"}`}
              >
                <FolderOpen size={18} />
                <span>Projects</span>
                {hydrated && chatStore.projects.length > 0 && (
                  <span className="ml-auto text-xs bg-gray-300/60 dark:bg-white/15 text-[#1a3a6b] dark:text-gray-300 px-1.5 py-0.5 rounded-full">
                    {chatStore.projects.length}
                  </span>
                )}
              </button>

              <button
                onClick={openGallery}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm cursor-pointer ${currentView === "gallery" ? "bg-[#1a6adf]/18 dark:bg-white/10 font-medium text-[#0a1628] dark:text-white shadow-sm" : "text-[#3a6aaa] hover:text-[#0a1628] hover:bg-[#1a6adf]/14 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/5"}`}
              >
                <Images size={18} />
                <span>Gallery</span>
                {artifacts.length > 0 && (
                  <span className="ml-auto text-xs bg-gray-300/60 dark:bg-white/15 text-[#1a3a6b] dark:text-gray-300 px-1.5 py-0.5 rounded-full">
                    {artifacts.length}
                  </span>
                )}
              </button>
            </div>

            {/* Sidebar Content - Always show chat history */}
            <div className="border-t border-[#1e468c]/12 dark:border-white/10 pt-4 flex-1 min-h-0 overflow-hidden flex flex-col">
              <h3 className="text-xs font-semibold text-[#3a6aaa] dark:text-gray-500 mb-2 px-3 flex items-center gap-1">
                <Clock size={12} /> RECENT CREATIONS
              </h3>
              <div className="space-y-1 overflow-y-auto flex-1 pr-1">
                {!hydrated ? (
                  <div className="text-sm text-[#3a6aaa] dark:text-gray-400 px-3 py-2">
                    Loading...
                  </div>
                ) : sortedChats.length === 0 ? (
                  <div className="text-sm text-[#3a6aaa] dark:text-gray-400 px-3 py-6 text-center">
                    <MessageSquare
                      size={20}
                      className="mx-auto mb-2 opacity-30"
                    />
                    <p>No chats yet</p>
                    <p className="text-xs mt-1">Start a new creation!</p>
                  </div>
                ) : (
                  sortedChats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`group flex items-center gap-1 px-2 py-2 rounded-lg transition-colors cursor-pointer ${activeChatId === chat.id && currentView === "chat" ? "bg-[#1a6adf]/18 dark:bg-white/10 text-[#0a1628] dark:text-white shadow-sm" : "text-[#3a6aaa] hover:text-[#0a1628] hover:bg-[#1a6adf]/14 dark:text-gray-400 dark:hover:bg-white/5"}`}
                    >
                      {renamingChatId === chat.id ? (
                        <div className="flex-1 flex items-center gap-1">
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && confirmRename()
                            }
                            className="flex-1 text-xs px-2 py-1 bg-white dark:bg-[#1a1525] border border-gray-300 dark:border-white/10 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#60aaff]"
                            autoFocus
                          />
                          <button
                            onClick={confirmRename}
                            className="p-1 hover:bg-gray-300 dark:hover:bg-white/10 rounded"
                          >
                            <Check size={12} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div
                            className="flex-1 min-w-0"
                            onClick={() => selectChat(chat.id)}
                          >
                            <div className="text-sm font-medium truncate">
                              {chat.title}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1 truncate">
                              {formatDate(chat.updatedAt)} ·{" "}
                              {chat.messages.length} msgs
                              {chat.projectId &&
                                (() => {
                                  const p = chatStore.projects.find(
                                    (proj) => proj.id === chat.projectId,
                                  );
                                  return p ? (
                                    <>
                                      ·{" "}
                                      <span className="text-[#1a6adf] dark:text-[#60aaff] truncate font-medium">
                                        #{p.name}
                                      </span>
                                    </>
                                  ) : null;
                                })()}
                            </div>
                          </div>
                          <div className="flex-shrink-0 relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setChatMenuOpenId(
                                  chatMenuOpenId === chat.id ? null : chat.id,
                                );
                              }}
                              className={`p-1 rounded transition-colors cursor-pointer ${chatMenuOpenId === chat.id ? "bg-gray-200 dark:bg-white/15 text-gray-700 dark:text-white" : "opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10"}`}
                            >
                              <MoreHorizontal size={14} />
                            </button>

                            {/* Three-dot dropdown menu */}
                            {chatMenuOpenId === chat.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-30"
                                  onClick={() => setChatMenuOpenId(null)}
                                />
                                <div className="absolute right-0 top-7 z-40 w-44 bg-white dark:bg-[#1a1525] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden animate-fade-in">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setChatMenuOpenId(null);
                                      setMovingChatId(chat.id);
                                      setIsMoveToProjectOpen(true);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                  >
                                    <FolderOpen size={13} /> Move to project
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setChatMenuOpenId(null);
                                      startRename(chat.id, chat.title);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                  >
                                    <Pencil size={13} /> Rename
                                  </button>
                                  <div className="border-t border-gray-100 dark:border-white/5" />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setChatMenuOpenId(null);
                                      deleteChat(chat.id);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                                  >
                                    <Trash2 size={13} /> Delete
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            {/* Footer - Account & Settings */}
            <div className="border-t border-gray-200 dark:border-white/10 pt-3 flex flex-col gap-2 mt-auto">
              {user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#1a6adf]/10 text-[#1a6adf] dark:bg-[#60aaff]/20 dark:text-[#60aaff] border border-[#1a6adf]/20 dark:border-[#60aaff]/40 flex items-center justify-center text-xs font-bold flex-shrink-0 select-none">
                      {user.email?.[0].toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                        {user.email}
                      </p>
                      <button
                        onClick={handleSignOut}
                        className="text-[10px] text-red-500 hover:underline cursor-pointer block text-left"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsSettingsOpen(true);
                      if (typeof window !== "undefined" && window.innerWidth < 768) {
                        setSidebarOpen(false);
                      }
                    }}
                    className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-all cursor-pointer flex-shrink-0"
                    title="Settings"
                  >
                    <Settings size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="flex-1 py-1.5 px-3 bg-[#1a6adf]/10 dark:bg-white/10 hover:bg-[#1a6adf]/20 dark:hover:bg-white/15 text-[#1a6adf] dark:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer border border-[#1a6adf]/20 dark:border-white/10"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setIsSettingsOpen(true);
                      if (typeof window !== "undefined" && window.innerWidth < 768) {
                        setSidebarOpen(false);
                      }
                    }}
                    className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-all cursor-pointer flex-shrink-0"
                    title="Settings"
                  >
                    <Settings size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Collapsed Icon-Only Sidebar (Width 56px) */
          <div className="p-3 w-14 flex flex-col items-center h-full gap-4 animate-fade-in z-20">
            {/* Panel toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="group w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-[#60aaff]/15 transition-all cursor-pointer relative"
              title="Expand sidebar"
            >
              <PanelLeft
                size={18}
                className="absolute opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out"
              />
              <div className="w-5.5 h-5.5 absolute opacity-100 group-hover:opacity-0 transition-all duration-300 ease-in-out flex items-center justify-center">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient
                      id="genesisGradSidebarCollapsed"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="50%" stopColor="#60aaff" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M26 16C26 21.5228 21.5228 26 16 26C10.4772 26 6 21.5228 6 16C6 10.4772 10.4772 6 16 6C19.3431 6 22.2868 7.6393 24.1002 10.1584"
                    stroke="url(#genesisGradSidebarCollapsed)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M16 16H25"
                    stroke="url(#genesisGradSidebarCollapsed)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M16 11L17.5 14.5L21 16L17.5 17.5L16 21L14.5 17.5L11 16L14.5 14.5L16 11Z"
                    fill="url(#genesisGradSidebarCollapsed)"
                  />
                </svg>
              </div>
            </button>

            {/* Collapsed Sidebar Items (Hidden on Mobile) */}
            <div className="hidden md:flex flex-col items-center gap-4 flex-1 w-full">
              {/* New chat */}
              <button
                onClick={startNewChat}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer relative ${currentView === "home" ? "bg-[#1a6adf]/18 text-[#0a1628] border border-[#1a6adf]/30 dark:bg-[#60aaff]/15 dark:text-[#60aaff] dark:border-[#60aaff]/20" : "text-[#3a6aaa] hover:text-[#0a1628] hover:bg-[#1a6adf]/14 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10"}`}
                title="New chat"
              >
                <SquarePen size={18} />
              </button>

              {/* Chat History Icon */}
              <button
                onClick={() => {
                  setCurrentView("chats");
                  setActiveChatId(null);
                }}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer relative ${currentView === "chats" || currentView === "chat" ? "bg-[#1a6adf]/18 text-[#0a1628] border border-[#1a6adf]/30 dark:bg-[#60aaff]/15 dark:text-[#60aaff] dark:border-[#60aaff]/20" : "text-[#3a6aaa] hover:text-[#0a1628] hover:bg-[#1a6adf]/14 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10"}`}
                title="Chats"
              >
                <MessageSquare size={18} />
                {hydrated && sortedChats.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#1a6adf] dark:bg-[#60aaff] rounded-full" />
                )}
              </button>

              {/* Projects Icon */}
              <button
                onClick={() => {
                  setCurrentView("projects");
                  setActiveProjectId(null);
                }}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${currentView === "projects" ? "bg-[#1a6adf]/18 text-[#0a1628] border border-[#1a6adf]/30 dark:bg-[#60aaff]/15 dark:text-[#60aaff] dark:border-[#60aaff]/20" : "text-[#3a6aaa] hover:text-[#0a1628] hover:bg-[#1a6adf]/14 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10"}`}
                title="Projects"
              >
                <FolderOpen size={18} />
              </button>

              {/* Gallery */}
              <button
                onClick={openGallery}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${currentView === "gallery" ? "bg-[#1a6adf]/18 text-[#0a1628] border border-[#1a6adf]/30 dark:bg-[#60aaff]/15 dark:text-[#60aaff] dark:border-[#60aaff]/20" : "text-[#3a6aaa] hover:text-[#0a1628] hover:bg-[#1a6adf]/14 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10"}`}
                title="Gallery"
              >
                <Images size={18} />
              </button>

              <div className="flex-1" />

              {/* Settings */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-[#3a6aaa] hover:text-[#0a1628] hover:bg-[#1a6adf]/14 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 transition-all cursor-pointer"
                title="Settings"
              >
                <Settings size={18} />
              </button>

              {/* Avatar */}
              <div
                onClick={() => setIsSettingsOpen(true)}
                className="w-8 h-8 rounded-full bg-[#0a1628] dark:bg-[#60aaff]/20 border border-[#0a1628]/20 dark:border-[#60aaff]/40 flex items-center justify-center text-xs font-bold text-white dark:text-[#60aaff] cursor-pointer select-none"
                title="Genesis User"
              >
                G
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 z-10 relative bg-transparent">
        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex bg-transparent relative">
          {/* Chat Area */}
          <div
            className={`flex-1 flex flex-col min-w-0 ${showArtifact && !isArtifactFullscreen ? "w-1/2" : showArtifact && isArtifactFullscreen ? "hidden" : "w-full"} bg-transparent`}
          >
            {/* Header */}
            <div className="border-b border-[#1e468c]/12 dark:border-white/10 p-4 flex items-center justify-between flex-shrink-0 bg-[#fffaf0]/28 dark:bg-transparent backdrop-blur-md dark:backdrop-blur-none">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Logo toggle button on mobile when sidebar is hidden */}
                {!sidebarOpen && (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="group md:hidden w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#60aaff]/15 transition-all cursor-pointer mr-1 relative flex-shrink-0"
                    title="Open sidebar"
                  >
                    <PanelLeft
                      size={18}
                      className="absolute opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out text-gray-500 dark:text-gray-400"
                    />
                    <div className="w-5.5 h-5.5 absolute opacity-100 group-hover:opacity-0 transition-all duration-300 ease-in-out flex items-center justify-center">
                      <svg
                        className="w-full h-full"
                        viewBox="0 0 32 32"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <defs>
                          <linearGradient
                            id="genesisGradHeaderMobile"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                          >
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="50%" stopColor="#60aaff" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M26 16C26 21.5228 21.5228 26 16 26C10.4772 26 6 21.5228 6 16C6 10.4772 10.4772 6 16 6C19.3431 6 22.2868 7.6393 24.1002 10.1584"
                          stroke="url(#genesisGradHeaderMobile)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M16 16H25"
                          stroke="url(#genesisGradHeaderMobile)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M16 11L17.5 14.5L21 16L17.5 17.5L16 21L14.5 17.5L11 16L14.5 14.5L16 11Z"
                          fill="url(#genesisGradHeaderMobile)"
                        />
                      </svg>
                    </div>
                  </button>
                )}

                {/* Show current chat title instead of toggle button */}
                {activeChatId && currentView === "chat" ? (
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 max-w-[180px] sm:max-w-[280px] truncate select-none">
                    {chatStore.chats.find((c) => c.id === activeChatId)
                      ?.title || "New Creation"}
                  </span>
                ) : (
                  !sidebarOpen && (
                    <span className="text-lg font-semibold text-slate-800 dark:text-white select-none">
                      Genesis
                    </span>
                  )
                )}
                <div className="flex items-center gap-1.5 select-none flex-shrink-0">
                  {/* Full plan badge on desktop/tablets */}
                  <div className="hidden sm:flex items-center gap-1.5 plan-badge-custom rounded-full px-3.5 py-1 text-xs font-medium">
                    <span>Free Plan</span>
                    <span className="opacity-60">·</span>
                    <button
                      onClick={() => setIsSettingsOpen(true)}
                      className="text-[#1a5acc] dark:text-[#b8d4ff] hover:text-[#0a1628] dark:hover:text-white hover:underline transition-all font-semibold cursor-pointer"
                    >
                      Upgrade
                    </button>
                  </div>

                  {/* Icon button only on mobile screens */}
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="flex sm:hidden w-8 h-8 rounded-full items-center justify-center bg-gradient-to-r from-[#1a6adf] to-[#508cf0] dark:from-[#60aaff]/15 dark:to-[#60aaff]/30 text-white dark:text-[#60aaff] border border-[#1a6adf]/30 dark:border-[#60aaff]/30 shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                    title="Upgrade Plan"
                  >
                    <Sparkles
                      size={14}
                      className="animate-pulse"
                      fill="currentColor"
                    />
                  </button>
                </div>
              </div>

              {/* Header Right Actions (e.g. Preview Panel Toggle Button) */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {!showArtifact && p5Code && (
                  <button
                    onClick={() => setShowArtifact(true)}
                    className="p-2 bg-[#fffaf0]/80 dark:bg-[#0f0a1e]/85 border border-[#1e468c]/12 dark:border-white/10 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all cursor-pointer shadow-sm backdrop-blur-sm"
                    title="Open Preview Panel"
                  >
                    <PanelRight size={17} />
                  </button>
                )}
              </div>
            </div>
            {currentView === "home" ? (
              <div className="flex-1 flex flex-col items-center justify-between md:justify-center p-4 md:p-8 md:gap-6 max-w-3xl mx-auto w-full h-full">
                {/* Greeting Section centered vertically in remaining space */}
                <div className="flex-1 md:flex-initial flex flex-col items-center justify-center text-center">
                  <div className="flex flex-col md:flex-row items-center gap-3.5 animate-fade-in mb-2 text-center md:text-left">
                    <div className="w-[38px] h-[38px] flex-shrink-0 mb-2 md:mb-0">
                      <svg
                        className="w-full h-full mx-auto md:mx-0"
                        viewBox="0 0 32 32"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <defs>
                          <linearGradient
                            id="genesisGradHome"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                          >
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="50%" stopColor="#60aaff" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M26 16C26 21.5228 21.5228 26 16 26C10.4772 26 6 21.5228 6 16C6 10.4772 10.4772 6 16 6C19.3431 6 22.2868 7.6393 24.1002 10.1584"
                          stroke="url(#genesisGradHome)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M16 16H25"
                          stroke="url(#genesisGradHome)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M16 11L17.5 14.5L21 16L17.5 17.5L16 21L14.5 17.5L11 16L14.5 14.5L16 11Z"
                          fill="url(#genesisGradHome)"
                        />
                      </svg>
                    </div>
                    <h1 className="font-serif text-3xl md:text-[40px] font-normal tracking-tight text-gray-900 dark:text-white leading-tight">
                      {greeting}, Creator
                    </h1>
                  </div>

                  <p className="hidden md:block text-gray-500 dark:text-[#b8d4ff]/80 text-center max-w-md text-sm leading-relaxed mb-2">
                    Create stunning visual content with AI. Describe what you
                    want, and watch it come to life in real-time.
                  </p>
                </div>

                {/* Input and Suggestions Wrapper Container at the bottom */}
                <div className="w-full max-w-[660px] flex flex-col items-center gap-2.5 animate-slide-up mt-auto md:mt-0">
                  {/* Mobile Quick Templates Dropup (Above input card, Mobile only) */}
                  <div className="w-full md:hidden relative">
                    <button
                      onClick={() =>
                        setIsMobileTemplatesOpen(!isMobileTemplatesOpen)
                      }
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-[#1a6adf]/10 dark:bg-white/5 border border-[#1a6adf]/30 dark:border-white/10 rounded-xl text-xs font-semibold text-[#1a6adf] dark:text-[#b8d4ff] hover:bg-[#1a6adf]/15 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <span>Getting started with a template</span>
                      <ChevronDown
                        size={14}
                        className={`transform transition-transform duration-200 ${isMobileTemplatesOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {isMobileTemplatesOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-20"
                          onClick={() => setIsMobileTemplatesOpen(false)}
                        />
                        <div className="absolute bottom-full left-0 right-0 mb-2 z-30 bg-white/95 dark:bg-[#0f0a1e]/95 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-xl max-h-60 overflow-y-auto shadow-xl p-2 animate-fade-in">
                          {creationTools.map((tool, index) => {
                            const Icon = tool.icon;
                            return (
                              <button
                                key={index}
                                onClick={() => {
                                  setInputMessage(tool.prompt);
                                  setIsMobileTemplatesOpen(false);
                                  setTimeout(
                                    () => chatInputRef.current?.focus(),
                                    50,
                                  );
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-[#1a6adf]/10 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                              >
                                <Icon
                                  size={14}
                                  className="text-[#1a6adf] dark:text-[#60aaff] flex-shrink-0"
                                />
                                <span>{tool.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Rich Input Card */}
                  <div className="w-full">
                    <div className="glass-panel rounded-2xl p-4 flex flex-col focus-within:border-[#1a6adf]/45 focus-within:shadow-[0_0_0_3px_rgba(26,106,223,0.10)] dark:focus-within:border-white/20 dark:focus-within:shadow-none transition-all duration-200 shadow-sm hover:shadow-md dark:shadow-black/20">
                      {/* Attached Images Preview */}
                      {attachedImages.length > 0 && (
                        <div className="flex flex-wrap gap-3 mb-3">
                          {attachedImages.map((img) => (
                            <div key={img.id} className="relative group">
                              <img
                                src={img.preview || img.url}
                                alt={img.name}
                                className="h-32 max-w-[180px] object-cover rounded-xl border-2 border-gray-200/50 dark:border-white/10 shadow-sm"
                              />
                              <button
                                onClick={() => removeAttachedImage(img.id)}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <textarea
                        ref={chatInputRef}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="How can I help you today?"
                        className="w-full bg-transparent border-0 outline-none resize-none min-h-[36px] max-h-[150px] text-[15px] leading-relaxed text-[#0a1628] dark:text-white placeholder-[#5580bb] dark:placeholder-gray-500"
                        rows={1}
                      />
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#1e468c]/12 dark:border-white/5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={
                              isUploading ||
                              attachedImages.length >=
                                FILE_UPLOAD_CONFIG.maxFiles
                            }
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
                            title="Attach image"
                          >
                            {isUploading ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Paperclip size={16} />
                            )}
                          </button>
                          {attachedImages.length > 0 && (
                            <span className="text-[10px] text-gray-400">
                              {attachedImages.length}/
                              {FILE_UPLOAD_CONFIG.maxFiles}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div ref={modelDropdownRef} className="relative">
                            <button
                              onClick={() => {
                                if (!preferences.developerMode) {
                                  toast({
                                    title: "Developer Mode Required",
                                    description:
                                      "Enable Developer Mode to select a model.",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                setIsModelDropdownOpen(!isModelDropdownOpen);
                              }}
                              className="flex items-center gap-1 bg-transparent hover:bg-[#1a6adf]/10 dark:hover:bg-white/10 rounded-lg py-1 px-2.5 text-xs text-gray-500 dark:text-gray-400 hover:text-[#0a1628] dark:hover:text-white transition-colors cursor-pointer font-medium"
                            >
                              <span>
                                {preferences.developerMode
                                  ? AI_MODELS[selectedModel]?.name ||
                                    selectedModel
                                  : "Auto"}
                              </span>
                              <ChevronDown
                                size={12}
                                className={`stroke-[2] transition-transform ${isModelDropdownOpen ? "rotate-180" : ""}`}
                              />
                            </button>
                            {isModelDropdownOpen && (
                              <div className="absolute bottom-full left-0 mb-2 w-56 bg-white dark:bg-[#151121] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl py-1.5 z-50 animate-fade-in">
                                <div className="px-3 py-1 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-white/5 mb-1">
                                  Select Model
                                </div>
                                {Object.entries(AI_MODELS).map(
                                  ([key, model]) => (
                                    <button
                                      key={key}
                                      onClick={() => {
                                        setSelectedModel(key as AIModel);
                                        setIsModelDropdownOpen(false);
                                      }}
                                      className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex items-center justify-between text-xs cursor-pointer ${key === selectedModel ? "text-[#1a6adf] dark:text-[#60aaff] font-medium bg-[#1a6adf]/5 dark:bg-[#60aaff]/5" : "text-gray-700 dark:text-gray-300"}`}
                                    >
                                      <div>
                                        <div className="font-medium">
                                          {model.name}
                                        </div>
                                        <div className="text-[10px] text-gray-400 dark:text-gray-500">
                                          {(
                                            model.contextWindow / 1000
                                          ).toLocaleString()}
                                          K tokens
                                        </div>
                                      </div>
                                      {key === selectedModel && (
                                        <Check size={14} />
                                      )}
                                    </button>
                                  ),
                                )}
                              </div>
                            )}
                          </div>
                          <span className="w-[1px] h-4 bg-[#1e468c]/12 dark:bg-white/10 mx-1" />
                          {isLoading ? (
                            <button
                              onClick={() => handleStopGeneration()}
                              className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
                              title="Stop Generation"
                            >
                              <Square size={15} className="fill-white" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSendMessage()}
                              className="p-1.5 bg-[#1a6adf] hover:bg-[#1a6adf]/90 dark:bg-white text-white dark:text-black dark:hover:bg-gray-100 rounded-lg shadow-sm transition-colors cursor-pointer"
                            >
                              <Send size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Templates Pills Layout (Desktop) */}
                  <div className="hidden md:flex w-full justify-center">
                    <div className="flex gap-1.5 flex-wrap justify-center w-full px-1">
                      {creationTools.map((tool, index) => {
                        const Icon = tool.icon;
                        return (
                          <button
                            key={index}
                            onClick={() => {
                              setInputMessage(tool.prompt);
                              setTimeout(
                                () => chatInputRef.current?.focus(),
                                50,
                              );
                            }}
                            className="flex items-center gap-1.5 suggestion-pill rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 active:scale-95 shadow-sm hover:-translate-y-0.5 cursor-pointer"
                          >
                            <Icon
                              size={13}
                              className="stroke-[1.8] flex-shrink-0"
                            />
                            <span>{tool.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : currentView === "projects" ? (
              /* Projects View */
              <div className="flex-1 overflow-y-auto p-8 animate-fade-in bg-transparent">
                <div className="max-w-5xl mx-auto">
                  {activeProjectId ? (
                    /* Project Detail View */
                    <div>
                      {/* Back button */}
                      <button
                        onClick={() => setActiveProjectId(null)}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-6 cursor-pointer"
                      >
                        ← Back to Projects
                      </button>

                      {(() => {
                        const project = chatStore.projects.find(
                          (p) => p.id === activeProjectId,
                        );
                        if (!project) return null;

                        const projectChats = chatStore.chats.filter(
                          (c) => c.projectId === project.id,
                        );

                        return (
                          <div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-gray-200 dark:border-white/10 pb-6">
                              <div>
                                <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-900 dark:text-white">
                                  <FolderOpen
                                    className="text-[#1a6adf] dark:text-[#60aaff]"
                                    size={28}
                                  />
                                  {project.name}
                                </h1>
                                {project.description && (
                                  <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm max-w-2xl">
                                    {project.description}
                                  </p>
                                )}
                                <p className="text-xs text-gray-400 mt-1">
                                  Created on {formatDate(project.createdAt)}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    const newChatId = chatStore.createChat(
                                      `New Chat in ${project.name}`,
                                    );
                                    chatStore.moveToProject(
                                      newChatId,
                                      project.id,
                                    );
                                    setActiveChatId(newChatId);
                                    setCurrentView("chat");
                                    setMessages([]);
                                    setP5Code("");
                                    setEditableCode("");
                                    setShowArtifact(false);
                                  }}
                                  className="px-4 py-2 bg-[#1a6adf] hover:bg-[#1a6adf]/90 dark:bg-white text-white dark:text-black dark:hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
                                >
                                  <Plus size={16} /> New Chat in Project
                                </button>
                                <button
                                  onClick={() => {
                                    if (
                                      confirm(
                                        "Are you sure you want to delete this project? The chats inside will not be deleted.",
                                      )
                                    ) {
                                      chatStore.deleteProject(project.id);
                                      setActiveProjectId(null);
                                    }
                                  }}
                                  className="p-2 border border-red-200 dark:border-red-950/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors cursor-pointer"
                                  title="Delete Project"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>

                            {projectChats.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-20 text-center">
                                <MessageSquare
                                  size={48}
                                  className="text-gray-300 dark:text-gray-600 mb-4"
                                />
                                <h2 className="text-lg font-semibold text-gray-500 dark:text-gray-400">
                                  No chats in this project yet
                                </h2>
                                <p className="text-sm text-gray-400 mt-1">
                                  Create a new chat above to start working on
                                  this project.
                                </p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {projectChats.map((chat) => (
                                  <div
                                    key={chat.id}
                                    onClick={() => selectChat(chat.id)}
                                    className="p-4 glass-panel glass-panel-hover rounded-xl cursor-pointer flex flex-col justify-between h-32 animate-fade-in"
                                  >
                                    <div>
                                      <div className="flex items-center justify-between gap-2">
                                        <h3 className="font-semibold text-sm truncate text-gray-800 dark:text-gray-200">
                                          {chat.title}
                                        </h3>
                                        <span className="text-[10px] bg-gray-100 dark:bg-white/5 text-gray-500 px-1.5 py-0.5 rounded">
                                          {chat.messages.length} msgs
                                        </span>
                                      </div>
                                      {chat.summary && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                                          {chat.summary}
                                        </p>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-2">
                                      Last active: {formatDate(chat.updatedAt)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    /* Projects Grid View */
                    <div>
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-900 dark:text-white">
                            <FolderOpen
                              size={28}
                              className="text-[#1a6adf] dark:text-[#60aaff]"
                            />
                            Projects
                          </h1>
                          <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Organize your creative visual workspaces
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            setNewProjectName("");
                            setNewProjectDesc("");
                            setIsCreateProjectOpen(true);
                          }}
                          className="px-4 py-2 bg-[#1a6adf] dark:bg-white text-white dark:text-black rounded-xl hover:bg-[#1a6adf]/90 dark:hover:bg-gray-100 transition-colors flex items-center gap-2 cursor-pointer text-sm font-medium shadow-sm"
                        >
                          <Plus size={18} /> New Project
                        </button>
                      </div>

                      {chatStore.projects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                          <FolderOpen
                            size={64}
                            className="text-gray-400 dark:text-gray-700 mb-4"
                          />
                          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-400 mb-2">
                            No projects yet
                          </h2>
                          <p className="text-gray-500 dark:text-gray-500 text-sm max-w-sm">
                            Create a project to group related codes, visual
                            canvases, and chat conversations.
                          </p>
                          <button
                            onClick={() => {
                              setNewProjectName("");
                              setNewProjectDesc("");
                              setIsCreateProjectOpen(true);
                            }}
                            className="mt-6 px-6 py-3 bg-[#1a6adf] dark:bg-white text-white dark:text-black rounded-xl hover:bg-[#1a6adf]/90 dark:hover:bg-gray-100 transition-colors flex items-center gap-2 cursor-pointer text-sm font-medium"
                          >
                            <Plus size={18} /> Create First Project
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                          {chatStore.projects.map((project) => {
                            const projectChatsCount = chatStore.chats.filter(
                              (c) => c.projectId === project.id,
                            ).length;
                            return (
                              <div
                                key={project.id}
                                onClick={() => setActiveProjectId(project.id)}
                                className="p-5 glass-panel glass-panel-hover rounded-2xl cursor-pointer flex flex-col justify-between min-h-[160px] group relative"
                              >
                                <div>
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="p-2 bg-[#1a6adf]/10 dark:bg-white/5 text-[#1a6adf] dark:text-[#60aaff] rounded-lg">
                                      <FolderOpen size={20} />
                                    </div>
                                    <span className="text-[10px] text-gray-400 group-hover:text-[#1a6adf] dark:group-hover:text-[#60aaff] transition-colors font-mono">
                                      {projectChatsCount} chat
                                      {projectChatsCount !== 1 ? "s" : ""}
                                    </span>
                                  </div>
                                  <h3 className="font-bold text-base mt-4 text-gray-800 dark:text-gray-100 group-hover:text-[#1a6adf] dark:group-hover:text-[#60aaff] transition-colors truncate">
                                    {project.name}
                                  </h3>
                                  {project.description && (
                                    <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                                      {project.description}
                                    </p>
                                  )}
                                </div>

                                <div className="text-[10px] text-gray-400 mt-4 flex items-center justify-between border-t border-gray-100 dark:border-white/5 pt-3">
                                  <span>
                                    Created: {formatDate(project.createdAt)}
                                  </span>
                                  <span className="opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                                    Open →
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : currentView === "chats" ? (
              /* Chats Dashboard View */
              <div className="flex-1 overflow-y-auto p-8 animate-fade-in bg-transparent">
                <div className="max-w-4xl mx-auto">
                  {/* Dashboard Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-900 dark:text-white">
                        <MessageSquare
                          size={28}
                          className="text-[#1a6adf] dark:text-[#60aaff]"
                        />
                        Chats
                      </h1>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage and search your visual chat history
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {isMultiSelectChats && selectedChatIds.length > 0 && (
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Are you sure you want to delete the ${selectedChatIds.length} selected chat(s)?`,
                              )
                            ) {
                              selectedChatIds.forEach((id) =>
                                chatStore.deleteChat(id),
                              );
                              setSelectedChatIds([]);
                              setIsMultiSelectChats(false);
                            }
                          }}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors cursor-pointer"
                        >
                          Delete Selected
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setIsMultiSelectChats(!isMultiSelectChats);
                          setSelectedChatIds([]);
                        }}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors cursor-pointer ${
                          isMultiSelectChats
                            ? "bg-[#1a6adf]/10 dark:bg-[#60aaff]/10 border-[#1a6adf] dark:border-[#60aaff] text-[#1a6adf] dark:text-[#60aaff]"
                            : "bg-transparent border-slate-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {isMultiSelectChats ? "Cancel" : "Select chats"}
                      </button>

                      <button
                        onClick={startNewChat}
                        className="px-4 py-2 bg-[#1a6adf] dark:bg-white text-white dark:text-black rounded-xl hover:bg-[#1a6adf]/90 dark:hover:bg-gray-100 transition-colors flex items-center gap-2 cursor-pointer text-sm font-medium shadow-sm"
                      >
                        <Plus size={18} /> New chat
                      </button>
                    </div>
                  </div>

                  {/* Search input */}
                  <div className="relative mb-6">
                    <Search
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                    />
                    <input
                      type="text"
                      placeholder="Search chats..."
                      value={chatSearchQuery}
                      onChange={(e) => setChatSearchQuery(e.target.value)}
                      className="w-full bg-[#1e293b]/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a6adf]/20 dark:focus:ring-white/20 text-[#0a1628] dark:text-white"
                    />
                    {chatSearchQuery && (
                      <button
                        onClick={() => setChatSearchQuery("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-white"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Chats list */}
                  {sortedChats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <MessageSquare
                        size={48}
                        className="text-gray-300 dark:text-gray-600 mb-4"
                      />
                      <h2 className="text-xl font-semibold text-gray-400 mb-2">
                        No chats yet
                      </h2>
                      <p className="text-gray-400 max-w-sm">
                        Start a conversation with Genesis and it will appear
                        here
                      </p>
                      <button
                        onClick={startNewChat}
                        className="mt-6 px-6 py-3 bg-[#1a6adf] dark:bg-white text-white dark:text-black rounded-xl hover:opacity-90 transition-opacity font-medium shadow-sm"
                      >
                        Create first chat
                      </button>
                    </div>
                  ) : (
                    (() => {
                      const filtered = sortedChats.filter((c) =>
                        c.title
                          .toLowerCase()
                          .includes(chatSearchQuery.toLowerCase()),
                      );

                      if (filtered.length === 0) {
                        return (
                          <div className="text-center py-10 text-gray-400">
                            No chats match "{chatSearchQuery}"
                          </div>
                        );
                      }

                      return (
                        <div className="flex flex-col">
                          {filtered.map((chat) => {
                            const isSelected = selectedChatIds.includes(
                              chat.id,
                            );
                            return (
                              <div
                                key={chat.id}
                                onClick={() => {
                                  if (isMultiSelectChats) {
                                    if (isSelected) {
                                      setSelectedChatIds(
                                        selectedChatIds.filter(
                                          (id) => id !== chat.id,
                                        ),
                                      );
                                    } else {
                                      setSelectedChatIds([
                                        ...selectedChatIds,
                                        chat.id,
                                      ]);
                                    }
                                  } else {
                                    selectChat(chat.id);
                                  }
                                }}
                                className="w-full flex items-center justify-between py-4 border-b border-gray-100 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/5 px-2 rounded-xl transition-all cursor-pointer group"
                              >
                                <div className="flex items-center gap-3">
                                  {isMultiSelectChats && (
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => {}}
                                      className="w-4 h-4 rounded border-gray-300 text-[#1a6adf] focus:ring-[#1a6adf] dark:border-white/10 dark:bg-white/5 cursor-pointer"
                                    />
                                  )}
                                  <span className="font-normal text-gray-800 dark:text-gray-200 group-hover:text-black dark:group-hover:text-white text-base">
                                    {chat.title}
                                  </span>
                                </div>
                                <span className="text-sm text-gray-400 dark:text-gray-500 shrink-0">
                                  {getRelativeTimeString(chat.updatedAt)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
            ) : currentView === "gallery" ? (
              /* Gallery View */
              <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-5xl mx-auto">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-900 dark:text-white">
                        <Images
                          size={28}
                          className="text-[#1a6adf] dark:text-[#60aaff]"
                        />
                        Gallery
                      </h1>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {artifacts.length} creation
                        {artifacts.length !== 1 ? "s" : ""} saved
                      </p>
                    </div>
                  </div>

                  {artifacts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Images size={64} className="text-gray-300 mb-4" />
                      <h2 className="text-xl font-semibold text-gray-400 mb-2">
                        No creations yet
                      </h2>
                      <p className="text-gray-400">
                        Start creating with AI and your p5.js / D3.js / SVG
                        creations will appear here
                      </p>
                      <button
                        onClick={startNewChat}
                        className="mt-6 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2"
                      >
                        <Plus size={18} /> New Creation
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {artifacts.map((artifact) => (
                        <div
                          key={artifact.id}
                          className="group glass-panel glass-panel-hover rounded-2xl overflow-hidden cursor-pointer flex flex-col"
                          onClick={() => loadArtifactCode(artifact)}
                        >
                          {/* Live Preview */}
                          <div className="aspect-square bg-gray-900 relative overflow-hidden">
                            {(artifact.renderer || "p5") === "d3" ? (
                              <D3Canvas
                                code={artifact.code}
                                width={300}
                                height={300}
                              />
                            ) : (artifact.renderer || "p5") === "svg" ? (
                              <SVGCanvas
                                code={artifact.code}
                                width={300}
                                height={300}
                              />
                            ) : (artifact.renderer || "p5") === "mermaid" ? (
                              <MermaidCanvas
                                code={artifact.code}
                                width={300}
                                height={300}
                              />
                            ) : (
                              <P5Canvas
                                code={artifact.code}
                                width={300}
                                height={300}
                              />
                            )}
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    loadArtifactCode(artifact);
                                  }}
                                  className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 flex items-center gap-1"
                                >
                                  <Play size={14} /> Open
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteArtifact(artifact.id);
                                  }}
                                  className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                          {/* Card info */}
                          <div className="p-4 bg-transparent border-t border-[#1e468c]/10 dark:border-white/5 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-semibold text-sm truncate flex-1 text-gray-800 dark:text-gray-200">
                                {artifact.chatTitle}
                              </h3>
                              {preferences.developerMode ? (
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded font-medium select-none ${(artifact.renderer || "p5") === "d3" ? "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400" : (artifact.renderer || "p5") === "svg" ? "bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400" : (artifact.renderer || "p5") === "mermaid" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" : "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400"}`}
                                >
                                  {(artifact.renderer || "p5") === "d3"
                                    ? "D3.js"
                                    : (artifact.renderer || "p5") === "svg"
                                      ? "SVG"
                                      : (artifact.renderer || "p5") === "mermaid"
                                        ? "Mermaid"
                                        : "p5.js"}
                                </span>
                              ) : (
                                (() => {
                                  const category = getCategoryInfo(
                                    artifact.renderer || "p5",
                                    artifact.code,
                                    artifact.chatTitle
                                  );
                                  const CategoryIcon = category.icon;
                                  return (
                                    <span
                                      className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-medium select-none ${category.colorClass}`}
                                    >
                                      <CategoryIcon size={10} />
                                      <span>{category.name}</span>
                                    </span>
                                  );
                                })()
                              )}
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {formatDate(artifact.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-6">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <h2 className="text-2xl font-bold mb-2">
                          Start creating
                        </h2>
                        <p className="text-gray-600">
                          Describe what you want to visualize
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5 max-w-3xl mx-auto">
                      {messages.map((msg, index) => {
                        const isUser = msg.type === "user";
                        const currentChat = activeChatId
                          ? chatStore.chats.find((c) => c.id === activeChatId)
                          : null;
                        const storeMessage = currentChat?.messages[index];
                        const activeVersionIdx =
                          storeMessage?.activeVersionIdx !== undefined
                            ? storeMessage.activeVersionIdx
                            : 0;
                        return (
                          <div
                            key={index}
                            className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}
                          >
                            {!isUser && (
                              <div className="hidden sm:flex w-7 h-7 rounded-full bg-[#1a6adf]/15 border border-[#1a6adf]/30 dark:bg-[#60aaff]/15 dark:border-[#60aaff]/30 items-center justify-center flex-shrink-0 mt-1 select-none">
                                <div className="w-6 h-6 flex items-center justify-center">
                                  <svg
                                    className="w-full h-full"
                                    viewBox="0 0 32 32"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <defs>
                                      <linearGradient
                                        id={`genesisGradMsg-${index}`}
                                        x1="0%"
                                        y1="0%"
                                        x2="100%"
                                        y2="100%"
                                      >
                                        <stop offset="0%" stopColor="#3b82f6" />
                                        <stop
                                          offset="50%"
                                          stopColor="#60aaff"
                                        />
                                        <stop
                                          offset="100%"
                                          stopColor="#8b5cf6"
                                        />
                                      </linearGradient>
                                    </defs>
                                    <path
                                      d="M26 16C26 21.5228 21.5228 26 16 26C10.4772 26 6 21.5228 6 16C6 10.4772 10.4772 6 16 6C19.3431 6 22.2868 7.6393 24.1002 10.1584"
                                      stroke={`url(#genesisGradMsg-${index})`}
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                    />
                                    <path
                                      d="M16 16H25"
                                      stroke={`url(#genesisGradMsg-${index})`}
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                    />
                                    <path
                                      d="M16 11L17.5 14.5L21 16L17.5 17.5L16 21L14.5 17.5L11 16L14.5 14.5L16 11Z"
                                      fill={`url(#genesisGradMsg-${index})`}
                                    />
                                  </svg>
                                </div>
                              </div>
                            )}
                            <div className="flex flex-col gap-1.5 max-w-[92%] sm:max-w-[80%] group">
                              <div
                                className={`p-4 rounded-xl shadow-sm border ${
                                  isUser
                                    ? "bg-[#1a6adf] dark:bg-[#60aaff]/10 border-transparent dark:border-[#60aaff]/20 text-white dark:text-[#b8d4ff]"
                                    : "glass-panel text-[#0a1628] dark:text-gray-100"
                                }`}
                              >
                                {isUser ? (
                                  editingMessageId === storeMessage?.id &&
                                  storeMessage ? (
                                    <div className="space-y-2 min-w-[220px]">
                                      <textarea
                                        value={editingMessageText}
                                        onChange={(e) =>
                                          setEditingMessageText(e.target.value)
                                        }
                                        className="w-full min-h-[60px] p-2 rounded-md border border-slate-300 dark:border-white/10 bg-white dark:bg-[#1a1525] text-sm text-gray-900 dark:text-white resize-y"
                                        autoFocus
                                      />
                                      <div className="flex gap-2 justify-end">
                                        <button
                                          onClick={() =>
                                            handleSaveHomeEdit(
                                              storeMessage.id,
                                              index,
                                            )
                                          }
                                          className="px-2.5 py-1 bg-white dark:bg-white text-black dark:text-black rounded text-xs font-semibold hover:bg-gray-100"
                                        >
                                          Save
                                        </button>
                                        <button
                                          onClick={() =>
                                            setEditingMessageId(null)
                                          }
                                          className="px-2.5 py-1 border border-white/20 rounded text-xs font-semibold text-white/80 hover:bg-white/10"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      {/* Display attached images in message */}
                                      {msg.images && msg.images.length > 0 && (
                                        <div className="mb-2">
                                          {msg.images.map((imgUrl, imgIdx) => (
                                            <img
                                              key={imgIdx}
                                              src={imgUrl}
                                              alt={`Attached image ${imgIdx + 1}`}
                                              className="max-w-[260px] max-h-[200px] object-cover rounded-xl border border-white/20 shadow-sm"
                                            />
                                          ))}
                                        </div>
                                      )}
                                      {msg.content && (
                                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                          {msg.content}
                                        </div>
                                      )}
                                    </div>
                                  )
                                ) : (
                                  renderAiMessage(msg.content, index)
                                )}
                              </div>

                              {/* Message Actions */}
                              <div
                                className={`flex items-center gap-2.5 px-1 mt-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150 select-none text-[11px] ${isUser ? "justify-end" : "justify-start"}`}
                              >
                                {/* Timestamp details with hover tooltip */}
                                <div className="relative group/tooltip flex items-center gap-1 cursor-default text-[10px] text-gray-400 dark:text-gray-500">
                                  <span>
                                    {formatMessageTimestamp(
                                      storeMessage?.timestamp || new Date(),
                                    )}
                                  </span>

                                  {/* Tooltip content */}
                                  <div
                                    className={`absolute bottom-full mb-1 hidden group-hover/tooltip:block bg-gray-900 dark:bg-popover border border-slate-700 dark:border-white/10 text-white dark:text-popover-foreground text-[10px] rounded px-2 py-1 shadow-md whitespace-nowrap z-50 ${isUser ? "right-0" : "left-0"}`}
                                  >
                                    {new Date(
                                      storeMessage?.timestamp || new Date(),
                                    ).toLocaleDateString("en-US", {
                                      dateStyle: "medium",
                                    })}
                                    ,{" "}
                                    {new Date(
                                      storeMessage?.timestamp || new Date(),
                                    ).toLocaleTimeString("en-US", {
                                      timeStyle: "short",
                                    })}{" "}
                                    — {isUser ? "you" : "assistant"}
                                  </div>
                                </div>

                                <span className="text-gray-300 dark:text-white/5 select-none">
                                  |
                                </span>

                                {/* Version Pagination */}
                                {storeMessage?.versions &&
                                  storeMessage.versions.length > 1 && (
                                    <>
                                      <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded px-1.5 py-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                                        <button
                                          disabled={activeVersionIdx === 0}
                                          onClick={() =>
                                            handleSwitchHomeVersion(
                                              storeMessage.id,
                                              activeVersionIdx - 1,
                                            )
                                          }
                                          className="hover:text-[#1a6adf] dark:hover:text-white disabled:opacity-30 cursor-pointer"
                                        >
                                          <ChevronLeft size={10} />
                                        </button>
                                        <span className="font-mono">
                                          {activeVersionIdx + 1} /{" "}
                                          {storeMessage.versions.length}
                                        </span>
                                        <button
                                          disabled={
                                            activeVersionIdx ===
                                            storeMessage.versions.length - 1
                                          }
                                          onClick={() =>
                                            handleSwitchHomeVersion(
                                              storeMessage.id,
                                              activeVersionIdx + 1,
                                            )
                                          }
                                          className="hover:text-[#1a6adf] dark:hover:text-white disabled:opacity-30 cursor-pointer"
                                        >
                                          <ChevronRight size={10} />
                                        </button>
                                      </div>
                                      <span className="text-gray-300 dark:text-white/5 select-none">
                                        |
                                      </span>
                                    </>
                                  )}

                                {!isUser && (
                                  <>
                                    <button
                                      className="hover:text-[#1a6adf] dark:hover:text-white transition-colors cursor-pointer"
                                      title="Like message"
                                    >
                                      <ThumbsUp size={11} />
                                    </button>
                                    <button
                                      className="hover:text-[#1a6adf] dark:hover:text-white transition-colors cursor-pointer"
                                      title="Dislike message"
                                    >
                                      <ThumbsDown size={11} />
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => handleCopyText(msg.content)}
                                  className="hover:text-[#1a6adf] dark:hover:text-white transition-colors cursor-pointer"
                                  title="Copy message"
                                >
                                  <Copy size={11} />
                                </button>
                                {isUser && storeMessage && (
                                  <button
                                    onClick={() => {
                                      setEditingMessageId(storeMessage.id);
                                      setEditingMessageText(msg.content);
                                    }}
                                    className="hover:text-[#1a6adf] dark:hover:text-white transition-colors cursor-pointer"
                                    title="Edit message"
                                  >
                                    <Pencil size={11} />
                                  </button>
                                )}
                                {storeMessage && (
                                  <button
                                    disabled={isLoading}
                                    onClick={() =>
                                      handleRegenerateMessage(storeMessage.id)
                                    }
                                    className="hover:text-[#1a6adf] dark:hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                                    title="Retry generation"
                                  >
                                    {regeneratingId === storeMessage.id ? (
                                      <Loader2
                                        className="animate-spin"
                                        size={11}
                                      />
                                    ) : (
                                      <RotateCw size={11} />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 p-4 rounded-xl">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
                                style={{ animationDelay: "0ms" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
                                style={{ animationDelay: "150ms" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
                                style={{ animationDelay: "300ms" }}
                              ></div>
                              <span className="ml-2 text-gray-600">
                                Creating...
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                <div className="border-t border-[#1e468c]/12 dark:border-white/10 p-4 flex-shrink-0 bg-transparent">
                  <div className="max-w-3xl mx-auto">
                    <div className="glass-panel rounded-2xl p-4 flex flex-col focus-within:border-[#1a6adf]/45 focus-within:shadow-[0_0_0_3px_rgba(26,106,223,0.10)] dark:focus-within:border-white/20 dark:focus-within:shadow-none transition-all duration-200 shadow-sm">
                      {/* Attached Images Preview */}
                      {attachedImages.length > 0 && (
                        <div className="flex flex-wrap gap-3 mb-3">
                          {attachedImages.map((img) => (
                            <div key={img.id} className="relative group">
                              <img
                                src={img.preview || img.url}
                                alt={img.name}
                                className="h-32 max-w-[180px] object-cover rounded-xl border-2 border-gray-200/50 dark:border-white/10 shadow-sm"
                              />
                              <button
                                onClick={() => removeAttachedImage(img.id)}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <textarea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (!isLoading) handleSendMessage();
                          }
                        }}
                        disabled={isLoading}
                        placeholder="How can I help you today?"
                        className="w-full bg-transparent border-0 outline-none resize-none min-h-[36px] max-h-[150px] text-[15px] leading-relaxed text-[#0a1628] dark:text-white placeholder-[#5580bb] dark:placeholder-gray-500 disabled:opacity-50"
                        rows={1}
                      />
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#1e468c]/12 dark:border-white/5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={
                              isLoading ||
                              isUploading ||
                              attachedImages.length >=
                                FILE_UPLOAD_CONFIG.maxFiles
                            }
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
                            title="Attach image"
                          >
                            {isUploading ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Paperclip size={16} />
                            )}
                          </button>
                          {attachedImages.length > 0 && (
                            <span className="text-[10px] text-gray-400">
                              {attachedImages.length}/
                              {FILE_UPLOAD_CONFIG.maxFiles}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="relative" ref={modelDropdownRef}>
                            <button
                              onClick={() => {
                                if (!preferences.developerMode) {
                                  toast({
                                    title: "Developer Mode Required",
                                    description:
                                      "Enable Developer Mode to select a model.",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                setIsModelDropdownOpen(!isModelDropdownOpen);
                              }}
                              disabled={isLoading}
                              className="flex items-center gap-1 bg-transparent hover:bg-[#1a6adf]/10 dark:hover:bg-white/10 rounded-lg py-1 px-2.5 text-xs text-gray-500 dark:text-gray-400 hover:text-[#0a1628] dark:hover:text-white transition-colors cursor-pointer font-medium disabled:opacity-50"
                            >
                              <span>
                                {preferences.developerMode
                                  ? AI_MODELS[selectedModel]?.name ||
                                    selectedModel
                                  : "Auto"}
                              </span>
                              <ChevronDown
                                size={12}
                                className={`stroke-[2] transition-transform ${isModelDropdownOpen ? "rotate-180" : ""}`}
                              />
                            </button>
                            {isModelDropdownOpen && (
                              <div className="absolute bottom-full left-0 mb-2 w-56 bg-white dark:bg-[#151121] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl py-1.5 z-50 animate-fade-in">
                                <div className="px-3 py-1 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-white/5 mb-1">
                                  Select Model
                                </div>
                                {Object.entries(AI_MODELS).map(
                                  ([key, model]) => (
                                    <button
                                      key={key}
                                      onClick={() => {
                                        setSelectedModel(key as AIModel);
                                        setIsModelDropdownOpen(false);
                                        if (activeChatId)
                                          chatStore.updateModelConfig(
                                            activeChatId,
                                            { model: key as AIModel },
                                          );
                                      }}
                                      className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex items-center justify-between text-xs cursor-pointer ${key === selectedModel ? "text-[#1a6adf] dark:text-[#60aaff] font-medium bg-[#1a6adf]/5 dark:bg-[#60aaff]/5" : "text-gray-700 dark:text-gray-300"}`}
                                    >
                                      <div>
                                        <div className="font-medium">
                                          {model.name}
                                        </div>
                                        <div className="text-[10px] text-gray-400 dark:text-gray-500">
                                          {(
                                            model.contextWindow / 1000
                                          ).toLocaleString()}
                                          K tokens
                                        </div>
                                      </div>
                                      {key === selectedModel && (
                                        <Check size={14} />
                                      )}
                                    </button>
                                  ),
                                )}
                              </div>
                            )}
                          </div>
                          <span className="w-[1px] h-4 bg-[#1e468c]/12 dark:bg-white/10 mx-1" />
                          {isLoading ? (
                            <button
                              onClick={() => handleStopGeneration()}
                              className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
                              title="Stop Generation"
                            >
                              <Square size={15} className="fill-white" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSendMessage()}
                              disabled={isLoading}
                              className="p-1.5 bg-[#1a6adf] hover:bg-[#1a6adf]/90 dark:bg-white text-white dark:text-black dark:hover:bg-gray-100 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <Send size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Artifact Preview Panel */}
          {showArtifact && (
            <div
              ref={previewPanelRef}
              className={`${isArtifactFullscreen ? "w-full" : "w-1/2"} flex flex-col transition-all duration-300 z-10 preview-panel-container relative`}
            >
              {isTrueFullscreen && (
                <button
                  onClick={toggleTrueFullscreen}
                  className="absolute top-4 right-4 z-50 p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-full border border-white/20 shadow-xl backdrop-blur-md transition-all cursor-pointer hover:scale-105"
                  title="Exit Fullscreen"
                >
                  <Minimize size={18} />
                </button>
              )}
              {/* Premium Claude-style Toolbar */}
              {!isTrueFullscreen && (
                <div className="flex flex-col bg-transparent backdrop-blur-md relative z-20">
                  {/* Row 1: Header */}
                  <div className="border-b border-[#1e468c]/10 dark:border-white/10 p-4 flex items-center justify-between flex-shrink-0 bg-transparent select-none">
                    {/* Left: Active File Tab */}
                    <div className="flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium backdrop-blur-md preview-panel-filetab">
                      {(() => {
                        if (preferences.developerMode) {
                          return (
                            <FileCode2
                              size={13}
                              className="text-gray-500 dark:text-[#7aaae8]"
                            />
                          );
                        }
                        const category = getCategoryInfo(
                          activeRenderer,
                          p5Code,
                          getFriendlyTitle()
                        );
                        const CategoryIcon = category.icon;
                        return (
                          <CategoryIcon
                            size={13}
                            className="text-gray-500 dark:text-[#7aaae8]"
                          />
                        );
                      })()}
                      <span>
                        {preferences.developerMode
                          ? activeRenderer === "svg"
                            ? "illustration.svg"
                            : activeRenderer === "mermaid"
                              ? "diagram.mmd"
                              : activeRenderer === "d3"
                                ? "visualization.js"
                                : "canvas.js"
                          : getFriendlyTitle()}
                      </span>
                    </div>

                    {/* Right: Window Controls */}
                    <div className="flex items-center gap-1.5">
                      <button className="p-1.5 rounded-md transition-all cursor-pointer preview-panel-action">
                        <MoreHorizontal size={15} />
                      </button>
                      {/* On Desktop: Wide View Toggle (Memperluas Kesamping) */}
                      <button
                        onClick={() =>
                          setIsArtifactFullscreen(!isArtifactFullscreen)
                        }
                        className="hidden sm:block p-1.5 rounded-md transition-all cursor-pointer preview-panel-action"
                        title={
                          isArtifactFullscreen
                            ? "Split View"
                            : "Wide View (Perluas Kesamping)"
                        }
                      >
                        {isArtifactFullscreen ? (
                          <Columns size={15} />
                        ) : (
                          <Layout size={15} />
                        )}
                      </button>
                      {/* True Fullscreen Toggle (Full Selayar) */}
                      <button
                        onClick={toggleTrueFullscreen}
                        className="p-1.5 rounded-md transition-all cursor-pointer preview-panel-action"
                        title={
                          isTrueFullscreen
                            ? "Exit Fullscreen"
                            : "Fullscreen (Full Selayar)"
                        }
                      >
                        {isTrueFullscreen ? (
                          <Minimize size={15} />
                        ) : (
                          <Maximize size={15} />
                        )}
                      </button>
                      {/* On Mobile: Chat Input Overlay Toggle */}
                      <button
                        onClick={() =>
                          setShowMobileChatInput(!showMobileChatInput)
                        }
                        className={`block sm:hidden p-1.5 rounded-md transition-all cursor-pointer preview-panel-action ${showMobileChatInput ? "text-[#1a6adf] dark:text-[#60aaff] bg-[#1a6adf]/10 dark:bg-white/10" : ""}`}
                        title="Toggle Chat Input"
                      >
                        <MessageSquare size={15} />
                      </button>
                      <button
                        onClick={() => {
                          setShowArtifact(false);
                          setShowMobileChatInput(false);
                        }}
                        className="p-1.5 rounded-md transition-all cursor-pointer preview-panel-action"
                        title="Close preview"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Tabs, stats, version history, copy/download */}
                  <div className="flex items-center justify-between px-4 py-2 flex-wrap gap-2 border-b border-[#1e468c]/10 dark:border-white/10 bg-transparent select-none">
                    {/* Left: Eye/Code/Diff Segmented controls & stats */}
                    <div className="flex items-center gap-3">
                      {preferences.developerMode && (
                        <div className="flex p-0.5 bg-[#1a6adf]/8 dark:bg-white/5 border border-[#1e468c]/10 dark:border-white/10 rounded-lg backdrop-blur-md">
                          <button
                            onClick={() => setActiveTab("preview")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer preview-panel-tab ${activeTab === "preview" ? "active" : ""}`}
                          >
                            <Eye size={13} />
                            <span className="hidden sm:inline">Preview</span>
                          </button>
                          <button
                            onClick={() => setActiveTab("code")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer preview-panel-tab ${activeTab === "code" ? "active" : ""}`}
                          >
                            <Code size={13} />
                            <span className="hidden sm:inline">Code</span>
                          </button>
                          <button
                            onClick={() => setActiveTab("diff")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer preview-panel-tab ${activeTab === "diff" ? "active" : ""}`}
                          >
                            <GitCompare size={13} />
                            <span className="hidden sm:inline">Diff</span>
                          </button>
                        </div>
                      )}

                      {/* Version history dropdown & file details */}
                      <div className="flex items-center gap-2 text-xs preview-panel-meta relative">
                        <div
                          onClick={() =>
                            setIsVersionDropdownOpen(!isVersionDropdownOpen)
                          }
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-[#1e468c]/15 dark:border-white/15 cursor-pointer select-none preview-panel-dropdown bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        >
                          <span className="font-semibold">
                            v{activeVersionNumber || 1}
                          </span>
                          <ChevronDown
                            size={10}
                            className={`transition-transform duration-200 ${isVersionDropdownOpen ? "rotate-180" : ""}`}
                          />
                        </div>

                        {isVersionDropdownOpen && codeVersions.length > 0 && (
                          <>
                            <div
                              className="fixed inset-0 z-30"
                              onClick={() => setIsVersionDropdownOpen(false)}
                            />
                            <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-[#151121] border border-gray-200 dark:border-white/10 rounded-lg shadow-lg py-1.5 z-40 max-h-60 overflow-y-auto animate-fade-in text-gray-900 dark:text-white">
                              <div className="px-3 py-1 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-white/5 mb-1 select-none">
                                Version History
                              </div>
                              {codeVersions.map((v) => (
                                <button
                                  key={v.versionNumber}
                                  onClick={() => {
                                    setActiveVersionNumber(v.versionNumber);
                                    setIsVersionDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex items-center justify-between text-xs cursor-pointer ${v.versionNumber === activeVersionNumber ? "text-[#1a6adf] dark:text-[#60aaff] font-medium bg-[#1a6adf]/5 dark:bg-[#60aaff]/5" : "text-gray-700 dark:text-gray-300"}`}
                                >
                                  <span>Version {v.versionNumber}</span>
                                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                                    {v.renderer.toUpperCase()}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </>
                        )}

                        <span className="hidden sm:inline">·</span>
                        <span className="font-mono text-[11px] hidden sm:inline">
                          {p5Code ? p5Code.split("\n").length : 0} lines ·{" "}
                          {p5Code ? (p5Code.length / 1024).toFixed(1) : 0} KB
                        </span>
                      </div>
                    </div>

                    {/* Right: Run, Copy & Download tools */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleRunCode}
                        className="p-1.5 rounded-md transition-all cursor-pointer preview-panel-action text-[#60aaff] hover:bg-[#60aaff]/10"
                        title="Update preview"
                      >
                        <RefreshCw size={14} />
                      </button>
                      <button
                        onClick={handleCopyCode}
                        className="p-1.5 rounded-md transition-all cursor-pointer relative preview-panel-action"
                        title="Copy code"
                      >
                        {copied ? (
                          <Check size={14} className="text-green-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                      <div className="relative" ref={downloadDropdownRef}>
                        <button
                          onClick={() => setIsDownloadDropdownOpen(!isDownloadDropdownOpen)}
                          className={`p-1.5 rounded-md transition-all cursor-pointer preview-panel-action flex items-center justify-center ${isDownloadDropdownOpen ? 'bg-gray-100 dark:bg-white/10 text-white' : ''}`}
                          title="Download options"
                        >
                          <Download size={14} />
                        </button>
                        {isDownloadDropdownOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-30"
                              onClick={() => {
                                setIsDownloadDropdownOpen(false);
                                setShowDownloadSettings(false);
                              }}
                            />
                            <div className="absolute top-full right-0 mt-1.5 w-56 bg-white dark:bg-[#151121] border border-gray-200 dark:border-white/10 rounded-lg shadow-lg py-1.5 z-40 animate-fade-in text-gray-900 dark:text-white">
                              {!showDownloadSettings ? (
                                <>
                                  <div className="px-3 pb-1.5 border-b border-gray-100 dark:border-white/5 mb-1.5 select-none">
                                    <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                      Download As
                                    </span>
                                  </div>
                                  
                                  <button
                                    onClick={() => {
                                      handleDownloadCode();
                                      setIsDownloadDropdownOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex items-center gap-2 text-xs cursor-pointer text-gray-700 dark:text-gray-300"
                                  >
                                    <FileCode2 size={13} className="text-[#60aaff]" />
                                    <span>Source Code</span>
                                  </button>
                                  
                                  <button
                                    onClick={handleDownloadImage}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex items-center gap-2 text-xs cursor-pointer text-gray-700 dark:text-gray-300"
                                  >
                                    <Image size={13} className="text-emerald-500" />
                                    <span>Image (PNG)</span>
                                  </button>

                                  {activeRenderer === "p5" && (
                                    <div className="flex items-center justify-between hover:bg-gray-100 dark:hover:bg-white/5 transition-colors pr-1.5 group">
                                      <button
                                        onClick={handleStartRecording}
                                        className="flex-1 text-left px-3 py-2 flex items-center gap-2 text-xs cursor-pointer text-gray-700 dark:text-gray-300"
                                      >
                                        <Video size={13} className="text-red-500" />
                                        <span>Video Animation (WebM)</span>
                                      </button>
                                      <button
                                        onClick={() => setShowDownloadSettings(true)}
                                        className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                        title="Video Settings"
                                      >
                                        <Settings size={12} className="group-hover:rotate-45 transition-transform duration-300" />
                                      </button>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <>
                                  <div className="px-3 pb-1 flex items-center border-b border-gray-100 dark:border-white/5 mb-2 select-none">
                                    <button
                                      onClick={() => setShowDownloadSettings(false)}
                                      className="p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer mr-1"
                                      title="Back"
                                    >
                                      <ChevronLeft size={14} />
                                    </button>
                                    <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex-1 text-left">
                                      Video Settings
                                    </span>
                                  </div>

                                  <div className="px-3 py-1 space-y-3">
                                    {/* Duration setting */}
                                    <div>
                                      <label className="text-[10px] font-medium text-gray-400 dark:text-gray-500 block mb-1">
                                        Video Duration: {downloadSettings.videoDuration}s
                                      </label>
                                      <div className="grid grid-cols-4 gap-1">
                                        {[5, 10, 15, 30].map((d) => (
                                          <button
                                            key={d}
                                            onClick={() => updateDownloadSettings({ videoDuration: d })}
                                            className={`py-1 rounded text-[10px] font-medium border text-center transition-colors cursor-pointer ${downloadSettings.videoDuration === d ? 'border-[#1a6adf] dark:border-[#60aaff] bg-[#1a6adf]/10 dark:bg-[#60aaff]/10 text-[#1a6adf] dark:text-[#60aaff]' : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400'}`}
                                          >
                                            {d}s
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    {/* FPS setting */}
                                    <div>
                                      <label className="text-[10px] font-medium text-gray-400 dark:text-gray-500 block mb-1">
                                        Video Frame Rate: {downloadSettings.videoFps} FPS
                                      </label>
                                      <div className="grid grid-cols-2 gap-1.5">
                                        {[30, 60].map((f) => (
                                          <button
                                            key={f}
                                            onClick={() => updateDownloadSettings({ videoFps: f })}
                                            className={`py-1.5 rounded text-[10px] font-medium border text-center transition-colors cursor-pointer ${downloadSettings.videoFps === f ? 'border-[#1a6adf] dark:border-[#60aaff] bg-[#1a6adf]/10 dark:bg-[#60aaff]/10 text-[#1a6adf] dark:text-[#60aaff]' : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400'}`}
                                          >
                                            {f} FPS
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-hidden relative">
                {activeTab === "preview" && (
                  <div
                    ref={previewViewportRef}
                    className="w-full h-full relative overflow-hidden select-none bg-slate-900/50 dark:bg-black/35 rounded-lg"
                  >
                    {/* Floating Video Recording Indicator */}
                    {isRecording && (
                      <div className="absolute top-4 left-4 z-50 flex items-center gap-2 bg-red-500/90 text-white px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm font-medium text-xs border border-red-400 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                        <span>Recording Video... {recordingProgress}s / 10s</span>
                        <button
                          onClick={handleStopRecording}
                          className="ml-2 px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded-md text-[10px] cursor-pointer transition-colors"
                        >
                          Stop
                        </button>
                      </div>
                    )}

                    {/* Floating Zoom & Pan Controls */}
                    <div
                      className={`absolute right-4 z-40 flex items-center gap-1 bg-white/90 dark:bg-black/80 border border-slate-200 dark:border-white/10 p-1.5 rounded-xl shadow-lg backdrop-blur-md transition-all duration-300 ${showMobileChatInput ? "bottom-28" : "bottom-4"}`}
                    >
                      <button
                        onClick={() => setPanMode(!panMode)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${panMode ? "bg-[#1a6adf] text-white" : "hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300"}`}
                        title={
                          panMode
                            ? "Interactive Mode (Mouse interaction)"
                            : "Pan Mode (Drag to move)"
                        }
                      >
                        <Hand size={14} />
                      </button>

                      <span className="w-[1px] h-4 bg-slate-200 dark:bg-white/10 mx-1" />

                      <button
                        onClick={handleZoomOut}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
                        title="Zoom Out"
                      >
                        <ZoomOut size={14} />
                      </button>

                      <span className="text-[10px] font-mono font-bold px-1.5 min-w-[36px] text-center text-gray-600 dark:text-gray-300">
                        {Math.round(zoom * 100)}%
                      </span>

                      <button
                        onClick={handleZoomIn}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
                        title="Zoom In"
                      >
                        <ZoomIn size={14} />
                      </button>

                      <span className="w-[1px] h-4 bg-slate-200 dark:bg-white/10 mx-1" />

                      <button
                        onClick={handleResetZoom}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
                        title="Reset Zoom & Pan"
                      >
                        <Move size={14} />
                      </button>
                    </div>

                    {/* Pan overlay - captures drag events when panMode is active */}
                    {panMode && (
                      <div
                        className="absolute inset-0 z-30 cursor-grab active:cursor-grabbing"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleMouseUp}
                      />
                    )}

                    {/* Scaled/Panned Content Wrapper */}
                    <div
                      className="w-full h-full flex items-center justify-center origin-center"
                      style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transition: isDragging
                          ? "none"
                          : "transform 0.15s ease-out",
                      }}
                    >
                      {p5Code && activeRenderer === "d3" ? (
                        <D3Canvas code={p5Code} width={400} height={400} />
                      ) : p5Code && activeRenderer === "svg" ? (
                        <SVGCanvas code={p5Code} width={400} height={400} />
                      ) : p5Code && activeRenderer === "mermaid" ? (
                        <MermaidCanvas code={p5Code} width={400} height={400} />
                      ) : p5Code ? (
                        <P5Canvas code={p5Code} width={400} height={400} />
                      ) : (
                        <div className="bg-gray-200 h-full flex items-center justify-center rounded-lg w-full">
                          <div className="text-center text-gray-500">
                            <Wand2
                              size={48}
                              className="mx-auto mb-4 opacity-50"
                            />
                            <p className="text-lg font-semibold">
                              No preview yet
                            </p>
                            <p className="text-sm">
                              Ask AI to create something visual!
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "code" && (
                  <div className="h-full flex flex-col">
                    <textarea
                      value={editableCode}
                      onChange={(e) => setEditableCode(e.target.value)}
                      placeholder="// p5.js code will appear here..."
                      className="flex-1 w-full bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-600"
                      spellCheck={false}
                    />
                  </div>
                )}

                {activeTab === "diff" && (
                  <div className="h-full">
                    <CodeDiff oldCode={previousCode} newCode={p5Code} />
                  </div>
                )}

                {/* Floating Mobile Chat Input overlay */}
                {showMobileChatInput && (
                  <div className="block sm:hidden absolute bottom-6 left-4 right-4 z-30 p-3 bg-[#fffaf0]/92 dark:bg-[#0f0a1e]/94 border border-[#1e468c]/15 dark:border-white/15 rounded-2xl backdrop-blur-md shadow-[0_10px_35px_rgba(26,106,223,0.15)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.55)]">
                    <div className="flex flex-col">
                      <textarea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (!isLoading && inputMessage.trim()) {
                              handleSendMessage();
                              setShowMobileChatInput(false);
                            }
                          }
                        }}
                        disabled={isLoading}
                        placeholder="Comment or ask for changes..."
                        className="w-full bg-transparent border-0 outline-none resize-none min-h-[36px] max-h-[80px] text-sm leading-relaxed text-[#0a1628] dark:text-white placeholder-[#5580bb] dark:placeholder-gray-500 disabled:opacity-50"
                        rows={1}
                      />
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#1e468c]/12 dark:border-white/5">
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 select-none">
                          Ask AI to edit this design...
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isLoading ? (
                            <button
                              onClick={() => {
                                handleStopGeneration();
                                setShowMobileChatInput(false);
                              }}
                              className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
                              title="Stop Generation"
                            >
                              <Square size={12} className="fill-white" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (!isLoading && inputMessage.trim()) {
                                  handleSendMessage();
                                  setShowMobileChatInput(false);
                                }
                              }}
                              disabled={isLoading || !inputMessage.trim()}
                              className="p-1.5 bg-[#1a6adf] hover:bg-[#1a6adf]/90 dark:bg-white text-white dark:text-black dark:hover:bg-gray-100 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <Send size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Move to Project Modal */}
      {isMoveToProjectOpen && movingChatId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151121] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in text-gray-900 dark:text-white">
            <div className="p-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <FolderOpen
                  className="text-[#1a6adf] dark:text-[#60aaff]"
                  size={18}
                />
                Move to Project
              </h3>
              <button
                onClick={() => {
                  setIsMoveToProjectOpen(false);
                  setMovingChatId(null);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 max-h-60 overflow-y-auto space-y-1">
              {/* Unassign option */}
              <button
                onClick={() => {
                  chatStore.moveToProject(movingChatId, null);
                  setIsMoveToProjectOpen(false);
                  setMovingChatId(null);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors flex items-center justify-between text-sm text-gray-500 cursor-pointer"
              >
                <span>None (Remove from Project)</span>
                {!chatStore.chats.find((c) => c.id === movingChatId)
                  ?.projectId && (
                  <Check
                    size={14}
                    className="text-[#1a6adf] dark:text-[#60aaff]"
                  />
                )}
              </button>

              {chatStore.projects.map((project) => {
                const isSelected =
                  chatStore.chats.find((c) => c.id === movingChatId)
                    ?.projectId === project.id;
                return (
                  <button
                    key={project.id}
                    onClick={() => {
                      chatStore.moveToProject(movingChatId, project.id);
                      setIsMoveToProjectOpen(false);
                      setMovingChatId(null);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors flex items-center justify-between text-sm cursor-pointer ${isSelected ? "text-[#1a6adf] dark:text-[#60aaff] font-medium bg-[#1a6adf]/5 dark:bg-[#60aaff]/5" : "text-gray-700 dark:text-gray-300"}`}
                  >
                    <span className="truncate">{project.name}</span>
                    {isSelected && <Check size={14} />}
                  </button>
                );
              })}
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-black/20 flex gap-2">
              <button
                onClick={() => {
                  setIsMoveToProjectOpen(false);
                  setNewProjectName("");
                  setNewProjectDesc("");
                  setIsCreateProjectOpen(true);
                }}
                className="w-full py-2 bg-gray-200 hover:bg-gray-300 dark:bg-white/10 dark:hover:bg-white/15 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} /> Create New Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {isCreateProjectOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151121] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in text-gray-900 dark:text-white">
            <div className="p-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <FolderOpen
                  className="text-[#1a6adf] dark:text-[#60aaff]"
                  size={18}
                />
                Create New Project
              </h3>
              <button
                onClick={() => setIsCreateProjectOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newProjectName.trim()) {
                      const id = chatStore.createProject(
                        newProjectName.trim(),
                        newProjectDesc.trim(),
                      );
                      if (movingChatId) {
                        chatStore.moveToProject(movingChatId, id);
                        setMovingChatId(null);
                      }
                      setIsCreateProjectOpen(false);
                      setNewProjectName("");
                      setNewProjectDesc("");
                    }
                  }}
                  placeholder="e.g. Visual Experiments"
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a6adf]/40 dark:focus:ring-[#60aaff]/30 transition-all"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  Description{" "}
                  <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="What is this project about?"
                  rows={2}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a6adf]/40 dark:focus:ring-[#60aaff]/30 transition-all resize-none"
                />
              </div>
            </div>

            <div className="p-5 pt-0 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsCreateProjectOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newProjectName.trim()) {
                    const id = chatStore.createProject(
                      newProjectName.trim(),
                      newProjectDesc.trim(),
                    );
                    if (movingChatId) {
                      chatStore.moveToProject(movingChatId, id);
                      setMovingChatId(null);
                    }
                    setIsCreateProjectOpen(false);
                    setNewProjectName("");
                    setNewProjectDesc("");
                  }
                }}
                disabled={!newProjectName.trim()}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${newProjectName.trim() ? "bg-[#1a6adf] dark:bg-white text-white dark:text-black hover:bg-[#1a6adf]/90 dark:hover:bg-gray-100 shadow-sm" : "bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-gray-600 cursor-not-allowed"}`}
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export default GenesisApp;
