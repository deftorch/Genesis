'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import {
  MessageSquare,
  Plus,
  Send,
  Trash2,
  Pencil,
  Check,
  Clock,
  BarChart3,
  Network,
  PieChart,
  Shapes,
  GitFork,
  Sparkles,
  Maximize2,
  Copy,
  FolderOpen,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Square,
  Paperclip,
  X,
  ChevronDown,
  Layout,
  Film,
  Image as ImageIcon,
  Play,
  RotateCw,
  ThumbsUp,
  ThumbsDown,
  Code,
} from 'lucide-react';

import { useUIStore } from '@/lib/store/ui-store';
import { useChatStore } from '@/lib/store/chat-store';
import { useSettingsStore } from '@/lib/store/settings-store';
import { useToast } from '@/lib/store/toast-store';
import { formatDate, formatMessageTimestamp } from '@/lib/utils';
import { AIModel, ImageAttachment, RendererType } from '@/types';
import { FILE_UPLOAD_CONFIG, AI_MODELS } from '@/config/constants';

const P5Canvas = dynamic(() => import('@/components/p5/P5Canvas'), { ssr: false });
const D3Canvas = dynamic(() => import('@/components/d3/D3Canvas'), { ssr: false });
const SVGCanvas = dynamic(() => import('@/components/svg/SVGCanvas'), { ssr: false });
const MermaidCanvas = dynamic(() => import('@/components/mermaid/MermaidCanvas'), { ssr: false });

const getRelativeTimeString = (dateInput: Date | string) => {
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getCategoryInfo = (renderer: RendererType, code: string = '', title: string = '') => {
  const t = title.toLowerCase();
  const c = code.toLowerCase();
  const r = renderer || 'p5';

  if (r === 'd3') {
    if (t.includes('pie') || c.includes('d3.arc') || c.includes('pie')) {
      return {
        name: 'Pie Chart',
        icon: PieChart,
        colorClass: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
      };
    }
    if (t.includes('network') || t.includes('graph') || c.includes('forcesimulation') || c.includes('link')) {
      return {
        name: 'Network',
        icon: Network,
        colorClass: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
      };
    }
    return {
      name: 'Bar Chart',
      icon: BarChart3,
      colorClass: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
    };
  }

  if (r === 'mermaid') {
    if (t.includes('sequence') || c.includes('sequencediagram')) {
      return {
        name: 'Sequence',
        icon: Clock,
        colorClass: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
      };
    }
    return {
      name: 'Flowchart',
      icon: Network,
      colorClass: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
    };
  }

  if (r === 'svg') {
    if (t.includes('diagram') || t.includes('flow') || t.includes('chart')) {
      return {
        name: 'Diagram',
        icon: GitFork,
        colorClass: 'bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400',
      };
    }
    return {
      name: 'Logo',
      icon: Shapes,
      colorClass: 'bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400',
    };
  }

  if (t.includes('game') || t.includes('play') || t.includes('interactive') || c.includes('keypressed') || c.includes('mouseclicked') || c.includes('game')) {
    return {
      name: 'Game',
      icon: Play,
      colorClass: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
    };
  }
  if (t.includes('pattern') || t.includes('wave') || t.includes('grid') || t.includes('gradient') || c.includes('sin(') || c.includes('cos(')) {
    return {
      name: 'Pattern',
      icon: Code,
      colorClass: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
    };
  }
  if (t.includes('animation') || t.includes('bouncing') || t.includes('particle') || c.includes('framecount') || c.includes('framerate')) {
    return {
      name: 'Animation',
      icon: Film,
      colorClass: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
    };
  }
  if (t.includes('art') || t.includes('fractal') || t.includes('generative') || c.includes('random') || c.includes('noise')) {
    return {
      name: 'Art',
      icon: ImageIcon,
      colorClass: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
    };
  }

  return {
    name: 'Canvas',
    icon: Layout,
    colorClass: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
  };
};

interface ChatPanelProps {
  messages: any[];
  isLoading: boolean;
  onSendMessage: (customPrompt?: string) => Promise<void>;
  onStopGeneration: () => void;
  attachedImages: ImageAttachment[];
  setAttachedImages: React.Dispatch<React.SetStateAction<ImageAttachment[]>>;
  removeAttachedImage: (id: string) => void;
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  chatInputRef: React.RefObject<HTMLTextAreaElement>;
  selectedModel: AIModel;
  setSelectedModel: (model: AIModel) => void;
  codeVersions: any[];
  regeneratingId: string | null;
  onRegenerate: (messageId: string) => void;
  onSwitchVersionIdx: (messageId: string, idx: number) => void;
  onSaveMessageEdit: (messageId: string, index: number, text: string) => void;

  onStartNewChat: () => void;
  onSelectChat: (id: string) => void;
  onLoadArtifactCode: (artifact: any) => void;
  onDeleteArtifact: (id: string) => void;

  chatSearchQuery: string;
  setChatSearchQuery: (query: string) => void;
  isMultiSelectChats: boolean;
  setIsMultiSelectChats: (val: boolean) => void;
  selectedChatIds: string[];
  setSelectedChatIds: React.Dispatch<React.SetStateAction<string[]>>;

  greeting: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  isLoading,
  onSendMessage,
  onStopGeneration,
  attachedImages,
  setAttachedImages,
  removeAttachedImage,
  isUploading,
  fileInputRef,
  chatInputRef,
  selectedModel,
  setSelectedModel,
  codeVersions,
  regeneratingId,
  onRegenerate,
  onSwitchVersionIdx,
  onSaveMessageEdit,
  onStartNewChat,
  onSelectChat,
  onLoadArtifactCode,
  onDeleteArtifact,
  chatSearchQuery,
  setChatSearchQuery,
  isMultiSelectChats,
  setIsMultiSelectChats,
  selectedChatIds,
  setSelectedChatIds,
  greeting,
}) => {
  const ui = useUIStore();
  const chatStore = useChatStore();
  const { preferences } = useSettingsStore();
  const { toast } = useToast();

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState<string>('');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Click outside model dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const creationTools = [
    { name: 'Canvas', icon: Layout, prompt: 'Create a colorful animated canvas' },
    { name: 'Animation', icon: Film, prompt: 'Create a smooth animation' },
    { name: 'Art', icon: ImageIcon, prompt: 'Create generative art' },
    { name: 'Game', icon: Play, prompt: 'Create a simple interactive game' },
    { name: 'Pattern', icon: Code, prompt: 'Create a mesmerizing pattern' },
    {
      name: 'Bar Chart',
      icon: BarChart3,
      prompt: 'Create an interactive bar chart with sample sales data using D3.js',
    },
    {
      name: 'Network',
      icon: Network,
      prompt: 'Create a force-directed network graph using D3.js',
    },
    {
      name: 'Pie Chart',
      icon: PieChart,
      prompt: 'Create an animated pie chart with sample data using D3.js',
    },
    {
      name: 'Logo',
      icon: Shapes,
      prompt: 'Create a modern, minimalist logo design using SVG',
    },
    {
      name: 'Diagram',
      icon: GitFork,
      prompt: 'Create a simple flowchart diagram using SVG',
    },
    {
      name: 'Flowchart',
      icon: Network,
      prompt: 'Create a professional flowchart using Mermaid.js showing a business process',
    },
    {
      name: 'Sequence',
      icon: Clock,
      prompt: 'Create a sequence diagram using Mermaid.js for a system interaction',
    },
  ];

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to Clipboard',
      description: 'Text copied successfully.',
    });
  };

  const handleSaveHomeEdit = (id: string, index: number) => {
    onSaveMessageEdit(id, index, editingMessageText);
    setEditingMessageId(null);
  };

  const renderAiMessage = (content: string, messageIndex: number) => {
    const codeRegex = /```(?:javascript|js|html|svg|mermaid|p5)?\n([\s\S]*?)```/g;
    const match = codeRegex.exec(content);

    if (match) {
      const textBefore = content.substring(0, match.index);
      const code = match[1];

      let rType: RendererType = 'p5';
      if (code.includes('// renderer: d3')) {
        rType = 'd3';
      } else if (code.includes('// renderer: svg') || code.includes('<svg')) {
        rType = 'svg';
      } else if (
        code.includes('// renderer: mermaid') ||
        code.includes('graph ') ||
        code.includes('flowchart ')
      ) {
        rType = 'mermaid';
      }

      const verObj = codeVersions.find((v) => v.messageIndex === messageIndex);

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
                  p: ({ ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                  strong: ({ ...props }) => <strong className="font-bold text-gray-900 dark:text-white" {...props} />,
                  em: ({ ...props }) => <em className="italic" {...props} />,
                  ul: ({ ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1 text-left" {...props} />,
                  ol: ({ ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1 text-left" {...props} />,
                  li: ({ ...props }) => <li className="text-sm" {...props} />,
                  code: ({ ...props }) => (
                    <code className="bg-gray-100 dark:bg-white/10 px-1 py-0.5 rounded text-xs font-mono" {...props} />
                  ),
                }}
              >
                {textBefore}
              </ReactMarkdown>
            </div>
          )}

          <div
            onClick={() => {
              ui.setShowArtifact(true);
              if (verObj) {
                ui.setActiveVersionNumber(verObj.versionNumber);
              } else {
                ui.setP5Code(code);
                ui.setEditableCode(code);
                ui.setActiveRenderer(rType);
              }
              ui.setActiveTab('preview');
            }}
            className="border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#090514]/45 overflow-hidden text-gray-200 max-w-full font-mono text-[12px] cursor-pointer hover:border-[#60aaff]/35 transition-all shadow-md group/card relative"
          >
            <div className="p-3 bg-white dark:bg-[#07030e]/30 rounded-xl overflow-hidden flex items-center justify-center min-h-[220px] max-h-[300px] relative select-none preview-in-chat">
              {rType === 'd3' && <D3Canvas code={code} width={380} height={200} />}
              {rType === 'svg' && <SVGCanvas code={code} width={380} height={200} />}
              {rType === 'mermaid' && <MermaidCanvas code={code} width={380} height={200} />}
              {rType === 'p5' && <P5Canvas code={code} width={380} height={200} />}

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
            p: ({ ...props }) => <p className="mb-2 last:mb-0" {...props} />,
            strong: ({ ...props }) => <strong className="font-bold text-gray-900 dark:text-white" {...props} />,
            em: ({ ...props }) => <em className="italic" {...props} />,
            ul: ({ ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1 text-left" {...props} />,
            ol: ({ ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1 text-left" {...props} />,
            li: ({ ...props }) => <li className="text-sm" {...props} />,
            code: ({ ...props }) => (
              <code className="bg-gray-100 dark:bg-white/10 px-1 py-0.5 rounded text-xs font-mono" {...props} />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  const sortedChats = [...chatStore.chats].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div
      className={`flex-1 flex flex-col min-w-0 ${ui.showArtifact && !ui.isArtifactFullscreen ? 'w-1/2' : ui.showArtifact && ui.isArtifactFullscreen ? 'hidden' : 'w-full'} bg-transparent`}
    >
      {/* Header */}
      <div className="border-b border-[#1e468c]/12 dark:border-white/10 p-4 flex items-center justify-between flex-shrink-0 bg-[#fffaf0]/28 dark:bg-transparent backdrop-blur-md dark:backdrop-blur-none">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {!ui.sidebarOpen && (
            <button
              onClick={() => ui.setSidebarOpen(true)}
              className="p-1.5 text-gray-400 hover:text-gray-950 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Expand sidebar"
            >
              <Layout size={18} />
            </button>
          )}

          {ui.activeChatId && ui.currentView === 'chat' ? (
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 max-w-[180px] sm:max-w-[280px] truncate select-none">
              {chatStore.chats.find((c) => c.id === ui.activeChatId)?.title || 'New Creation'}
            </span>
          ) : (
            !ui.sidebarOpen && (
              <span className="text-lg font-semibold text-slate-800 dark:text-white select-none">
                Genesis
              </span>
            )
          )}
          <div className="flex items-center gap-1.5 select-none flex-shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 plan-badge-custom rounded-full px-3.5 py-1 text-xs font-medium">
              <span>Free Plan</span>
              <span className="opacity-60">·</span>
              <button
                onClick={() => ui.setIsSettingsOpen(true)}
                className="text-[#1a5acc] dark:text-[#b8d4ff] hover:text-[#0a1628] dark:hover:text-white hover:underline transition-all font-semibold cursor-pointer"
              >
                Upgrade
              </button>
            </div>

            <button
              onClick={() => ui.setIsSettingsOpen(true)}
              className="flex sm:hidden w-8 h-8 rounded-full items-center justify-center bg-gradient-to-r from-[#1a6adf] to-[#508cf0] dark:from-[#60aaff]/15 dark:to-[#60aaff]/30 text-white dark:text-[#60aaff] border border-[#1a6adf]/30 dark:border-[#60aaff]/30 shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              title="Upgrade Plan"
            >
              <Sparkles size={14} className="animate-pulse" fill="currentColor" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {!ui.showArtifact && ui.p5Code && (
            <button
              onClick={() => ui.setShowArtifact(true)}
              className="p-2 bg-[#fffaf0]/80 dark:bg-[#0f0a1e]/85 border border-[#1e468c]/12 dark:border-white/10 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all cursor-pointer shadow-sm backdrop-blur-sm"
              title="Open Preview Panel"
            >
              <ChevronRight size={17} />
            </button>
          )}
        </div>
      </div>

      {/* Conditionally Render views */}
      {ui.currentView === 'home' ? (
        <div className="flex-1 flex flex-col items-center justify-between md:justify-center p-4 md:p-8 md:gap-6 max-w-3xl mx-auto w-full h-full">
          <div className="flex-1 md:flex-initial flex flex-col items-center justify-center text-center">
            <div className="flex flex-col md:flex-row items-center gap-3.5 animate-fade-in mb-2 text-center md:text-left">
              <div className="w-[38px] h-[38px] flex-shrink-0 mb-2 md:mb-0">
                <svg className="w-full h-full mx-auto md:mx-0" viewBox="0 0 32 32" fill="none">
                  <defs>
                    <linearGradient id="genesisGradHome" x1="0%" y1="0%" x2="100%" y2="100%">
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
                  <path d="M16 16H25" stroke="url(#genesisGradHome)" strokeWidth="2.5" strokeLinecap="round" />
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
              Create stunning visual content with AI. Describe what you want, and watch it come to life in real-time.
            </p>
          </div>

          <div className="w-full max-w-[660px] flex flex-col items-center gap-2.5 animate-slide-up mt-auto md:mt-0">
            <div className="w-full md:hidden relative">
              <button
                onClick={() => ui.setIsMobileTemplatesOpen(!ui.isMobileTemplatesOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-[#1a6adf]/10 dark:bg-white/5 border border-[#1a6adf]/30 dark:border-white/10 rounded-xl text-xs font-semibold text-[#1a6adf] dark:text-[#b8d4ff] hover:bg-[#1a6adf]/15 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <span>Getting started with a template</span>
                <ChevronDown
                  size={14}
                  className={`transform transition-transform duration-200 ${ui.isMobileTemplatesOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {ui.isMobileTemplatesOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => ui.setIsMobileTemplatesOpen(false)} />
                  <div className="absolute bottom-full left-0 right-0 mb-2 z-30 bg-white/95 dark:bg-[#0f0a1e]/95 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-xl max-h-60 overflow-y-auto shadow-xl p-2 animate-fade-in">
                    {creationTools.map((tool, index) => {
                      const Icon = tool.icon;
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            ui.setInputMessage(tool.prompt);
                            ui.setIsMobileTemplatesOpen(false);
                            setTimeout(() => chatInputRef.current?.focus(), 50);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-[#1a6adf]/10 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                        >
                          <Icon size={14} className="text-[#1a6adf] dark:text-[#60aaff] flex-shrink-0" />
                          <span>{tool.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Main input card for home view */}
            <div className="w-full glass-panel rounded-3xl p-4 md:p-5 flex flex-col focus-within:border-[#1a6adf]/45 focus-within:shadow-[0_0_0_3px_rgba(26,106,223,0.10)] dark:focus-within:border-white/20 dark:focus-within:shadow-none transition-all duration-200">
              {attachedImages.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-3">
                  {attachedImages.map((img) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.preview || img.url}
                        alt={img.name}
                        className="h-28 w-28 object-cover rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm"
                      />
                      <button
                        onClick={() => removeAttachedImage(img.id)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-gray-900/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <textarea
                value={ui.inputMessage}
                onChange={(e) => ui.setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!isLoading) onSendMessage();
                  }
                }}
                disabled={isLoading}
                placeholder="What would you like to create today?"
                className="w-full bg-transparent border-0 outline-none resize-none min-h-[44px] max-h-[180px] text-base leading-relaxed text-[#0a1628] dark:text-white placeholder-[#5580bb] dark:placeholder-gray-500 disabled:opacity-50"
                rows={1}
                ref={chatInputRef}
              />
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#1e468c]/12 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading || isUploading || attachedImages.length >= FILE_UPLOAD_CONFIG.maxFiles}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
                    title="Attach image"
                  >
                    {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
                  </button>
                  {attachedImages.length > 0 && (
                    <span className="text-[10px] text-gray-400 font-mono">
                      {attachedImages.length}/{FILE_UPLOAD_CONFIG.maxFiles}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative" ref={modelDropdownRef}>
                    <button
                      onClick={() => {
                        if (!preferences.developerMode) {
                          toast({
                            title: 'Developer Mode Required',
                            description: 'Enable Developer Mode to select a model.',
                            variant: 'destructive',
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
                          ? AI_MODELS[selectedModel]?.name || selectedModel
                          : 'Auto'}
                      </span>
                      <ChevronDown size={12} className={`stroke-[2] transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isModelDropdownOpen && (
                      <div className="absolute bottom-full left-0 mb-2 w-56 bg-white dark:bg-[#151121] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl py-1.5 z-50 animate-fade-in">
                        <div className="px-3 py-1 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-white/5 mb-1">
                          Select Model
                        </div>
                        {Object.entries(AI_MODELS).map(([modelId, m]) => (
                          <button
                            key={modelId}
                            onClick={() => {
                              setSelectedModel(modelId as AIModel);
                              setIsModelDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex items-center justify-between text-xs cursor-pointer ${selectedModel === modelId ? 'text-[#1a6adf] dark:text-[#60aaff] font-medium' : 'text-gray-700 dark:text-gray-300'}`}
                          >
                            <span>{m.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onSendMessage()}
                    disabled={isLoading || (!ui.inputMessage.trim() && attachedImages.length === 0)}
                    className="p-2.5 bg-[#1a6adf] dark:bg-white text-white dark:text-black hover:opacity-95 rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick templates for desktop view */}
            <div className="hidden md:grid grid-cols-4 gap-2 w-full text-left select-none">
              {creationTools.slice(0, 4).map((tool, index) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={index}
                    onClick={() => {
                      ui.setInputMessage(tool.prompt);
                      setTimeout(() => chatInputRef.current?.focus(), 50);
                    }}
                    className="flex flex-col gap-2 p-3 bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-[#1a6adf]/40 dark:hover:border-white/20 rounded-xl transition-all cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10 hover:scale-[1.01]"
                  >
                    <Icon size={16} className="text-[#1a6adf] dark:text-[#60aaff]" />
                    <span className="text-[11px] font-medium text-gray-800 dark:text-gray-200">
                      {tool.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : ui.currentView === 'projects' ? (
        <div className="flex-1 overflow-y-auto p-8 animate-fade-in bg-transparent">
          <div className="max-w-5xl mx-auto">
            {ui.activeProjectId ? (
              <div>
                <button
                  onClick={() => ui.setActiveProjectId(null)}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-6 cursor-pointer"
                >
                  ← Back to Projects
                </button>

                {(() => {
                  const project = chatStore.projects.find((p) => p.id === ui.activeProjectId);
                  if (!project) return null;

                  const projectChats = chatStore.chats.filter((c) => c.projectId === project.id);

                  return (
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-gray-200 dark:border-white/10 pb-6">
                        <div>
                          <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-900 dark:text-white">
                            <FolderOpen className="text-[#1a6adf] dark:text-[#60aaff]" size={28} />
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
                              const newChatId = chatStore.createChat(`New Chat in ${project.name}`);
                              chatStore.moveToProject(newChatId, project.id);
                              ui.setActiveChatId(newChatId);
                              ui.setCurrentView('chat');
                              ui.setP5Code('');
                              ui.setEditableCode('');
                              ui.setShowArtifact(false);
                            }}
                            className="px-4 py-2 bg-[#1a6adf] hover:bg-[#1a6adf]/90 dark:bg-white text-white dark:text-black dark:hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
                          >
                            <Plus size={16} /> New Chat in Project
                          </button>
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  'Are you sure you want to delete this project? The chats inside will not be deleted.'
                                )
                              ) {
                                chatStore.deleteProject(project.id);
                                ui.setActiveProjectId(null);
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
                          <MessageSquare size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
                          <h2 className="text-lg font-semibold text-gray-500 dark:text-gray-400">
                            No chats in this project yet
                          </h2>
                          <p className="text-sm text-gray-400 mt-1">
                            Create a new chat above to start working on this project.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {projectChats.map((chat) => (
                            <div
                              key={chat.id}
                              onClick={() => onSelectChat(chat.id)}
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
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-900 dark:text-white">
                      <FolderOpen size={28} className="text-[#1a6adf] dark:text-[#60aaff]" />
                      Projects
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Organize your creative visual workspaces
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setNewProjectName('');
                      setNewProjectDesc('');
                      ui.setIsCreateProjectOpen(true);
                    }}
                    className="px-4 py-2 bg-[#1a6adf] dark:bg-white text-white dark:text-black rounded-xl hover:bg-[#1a6adf]/90 dark:hover:bg-gray-100 transition-colors flex items-center gap-2 cursor-pointer text-sm font-medium shadow-sm"
                  >
                    <Plus size={18} /> New Project
                  </button>
                </div>

                {chatStore.projects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                    <FolderOpen size={64} className="text-gray-400 dark:text-gray-700 mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-400 mb-2">
                      No projects yet
                    </h2>
                    <p className="text-gray-500 dark:text-gray-500 text-sm max-w-sm">
                      Create a project to group related codes, visual canvases, and chat conversations.
                    </p>
                    <button
                      onClick={() => {
                        setNewProjectName('');
                        setNewProjectDesc('');
                        ui.setIsCreateProjectOpen(true);
                      }}
                      className="mt-6 px-6 py-3 bg-[#1a6adf] dark:bg-white text-white dark:text-black rounded-xl hover:bg-[#1a6adf]/90 dark:hover:bg-gray-100 transition-colors flex items-center gap-2 cursor-pointer text-sm font-medium"
                    >
                      <Plus size={18} /> Create First Project
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                    {chatStore.projects.map((project) => {
                      const projectChatsCount = chatStore.chats.filter((c) => c.projectId === project.id).length;
                      return (
                        <div
                          key={project.id}
                          onClick={() => ui.setActiveProjectId(project.id)}
                          className="p-5 glass-panel glass-panel-hover rounded-2xl cursor-pointer flex flex-col justify-between min-h-[160px] group relative"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <div className="p-2 bg-[#1a6adf]/10 dark:bg-white/5 text-[#1a6adf] dark:text-[#60aaff] rounded-lg">
                                <FolderOpen size={20} />
                              </div>
                              <span className="text-[10px] text-gray-400 group-hover:text-[#1a6adf] dark:group-hover:text-[#60aaff] transition-colors font-mono">
                                {projectChatsCount} chat{projectChatsCount !== 1 ? 's' : ''}
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
                            <span>Created: {formatDate(project.createdAt)}</span>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity font-medium font-mono">
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
      ) : ui.currentView === 'chats' ? (
        <div className="flex-1 overflow-y-auto p-8 animate-fade-in bg-transparent">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-900 dark:text-white">
                  <MessageSquare size={28} className="text-[#1a6adf] dark:text-[#60aaff]" />
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
                      if (confirm(`Are you sure you want to delete the ${selectedChatIds.length} selected chat(s)?`)) {
                        selectedChatIds.forEach((id) => chatStore.deleteChat(id));
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
                      ? 'bg-[#1a6adf]/10 dark:bg-[#60aaff]/10 border-[#1a6adf] dark:border-[#60aaff] text-[#1a6adf] dark:text-[#60aaff]'
                      : 'bg-transparent border-slate-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {isMultiSelectChats ? 'Cancel' : 'Select chats'}
                </button>

                <button
                  onClick={onStartNewChat}
                  className="px-4 py-2 bg-[#1a6adf] dark:bg-white text-white dark:text-black rounded-xl hover:bg-[#1a6adf]/90 dark:hover:bg-gray-100 transition-colors flex items-center gap-2 cursor-pointer text-sm font-medium shadow-sm"
                >
                  <Plus size={18} /> New chat
                </button>
              </div>
            </div>

            <div className="relative mb-6">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search chats..."
                value={chatSearchQuery}
                onChange={(e) => setChatSearchQuery(e.target.value)}
                className="w-full bg-[#1e293b]/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a6adf]/20 dark:focus:ring-white/20 text-[#0a1628] dark:text-white"
              />
              {chatSearchQuery && (
                <button
                  onClick={() => setChatSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {sortedChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <MessageSquare size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
                <h2 className="text-xl font-semibold text-gray-400 mb-2">No chats yet</h2>
                <p className="text-gray-400 max-w-sm">
                  Start a conversation with Genesis and it will appear here
                </p>
                <button
                  onClick={onStartNewChat}
                  className="mt-6 px-6 py-3 bg-[#1a6adf] dark:bg-white text-white dark:text-black rounded-xl hover:opacity-90 transition-opacity font-medium shadow-sm"
                >
                  Create first chat
                </button>
              </div>
            ) : (
              (() => {
                const filtered = sortedChats.filter((c) =>
                  c.title.toLowerCase().includes(chatSearchQuery.toLowerCase())
                );

                if (filtered.length === 0) {
                  return <div className="text-center py-10 text-gray-400">No chats match "{chatSearchQuery}"</div>;
                }

                return (
                  <div className="flex flex-col">
                    {filtered.map((chat) => {
                      const isSelected = selectedChatIds.includes(chat.id);
                      return (
                        <div
                          key={chat.id}
                          onClick={() => {
                            if (isMultiSelectChats) {
                              if (isSelected) {
                                setSelectedChatIds(selectedChatIds.filter((id) => id !== chat.id));
                              } else {
                                setSelectedChatIds([...selectedChatIds, chat.id]);
                              }
                            } else {
                              onSelectChat(chat.id);
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
      ) : ui.currentView === 'gallery' ? (
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-900 dark:text-white">
                  <ImageIcon size={28} className="text-[#1a6adf] dark:text-[#60aaff]" />
                  Gallery
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {chatStore.artifacts.length} creation{chatStore.artifacts.length !== 1 ? 's' : ''} saved
                </p>
              </div>
            </div>

            {chatStore.artifacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <ImageIcon size={64} className="text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-400 mb-2">No creations yet</h2>
                <p className="text-gray-400 text-center max-w-md">
                  Start creating with AI and your p5.js / D3.js / SVG / Mermaid creations will appear here
                </p>
                <button
                  onClick={onStartNewChat}
                  className="mt-6 px-6 py-3 bg-black dark:bg-white dark:text-black text-white rounded-xl hover:scale-102 transition-transform flex items-center gap-2"
                >
                  <Plus size={18} /> New Creation
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {chatStore.artifacts.map((artifact) => (
                  <div
                    key={artifact.id}
                    className="group glass-panel glass-panel-hover rounded-2xl overflow-hidden cursor-pointer flex flex-col"
                    onClick={() => onLoadArtifactCode(artifact)}
                  >
                    <div className="aspect-square bg-gray-900 relative overflow-hidden">
                      {(artifact.renderer || 'p5') === 'd3' ? (
                        <D3Canvas code={artifact.code} width={300} height={300} />
                      ) : (artifact.renderer || 'p5') === 'svg' ? (
                        <SVGCanvas code={artifact.code} width={300} height={300} />
                      ) : (artifact.renderer || 'p5') === 'mermaid' ? (
                        <MermaidCanvas code={artifact.code} width={300} height={300} />
                      ) : (
                        <P5Canvas code={artifact.code} width={300} height={300} />
                      )}

                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onLoadArtifactCode(artifact);
                            }}
                            className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 flex items-center gap-1 cursor-pointer"
                          >
                            <Play size={14} /> Open
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteArtifact(artifact.id);
                            }}
                            className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-transparent border-t border-[#1e468c]/10 dark:border-white/5 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-sm truncate flex-1 text-gray-800 dark:text-gray-200">
                          {artifact.chatTitle}
                        </h3>
                        {preferences.developerMode ? (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-medium select-none ${(artifact.renderer || 'p5') === 'd3' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400' : (artifact.renderer || 'p5') === 'svg' ? 'bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400' : (artifact.renderer || 'p5') === 'mermaid' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400'}`}
                          >
                            {(artifact.renderer || 'p5') === 'd3'
                              ? 'D3.js'
                              : (artifact.renderer || 'p5') === 'svg'
                                ? 'SVG'
                                : (artifact.renderer || 'p5') === 'mermaid'
                                  ? 'Mermaid'
                                  : 'p5.js'}
                          </span>
                        ) : (
                          (() => {
                            const category = getCategoryInfo(
                              artifact.renderer || 'p5',
                              artifact.code,
                              artifact.chatTitle
                            );
                            const CategoryIcon = category.icon;
                            return (
                              <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-medium select-none ${category.colorClass}`}>
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
        /* Active Chat View */
        <>
          <div className="flex-1 overflow-y-auto p-6">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">Start creating</h2>
                  <p className="text-gray-600">Describe what you want to visualize</p>
                </div>
              </div>
            ) : (
              <div className="space-y-5 max-w-3xl mx-auto">
                {messages.map((msg, index) => {
                  const isUser = msg.type === 'user';
                  const currentChat = ui.activeChatId
                    ? chatStore.chats.find((c) => c.id === ui.activeChatId)
                    : null;
                  const storeMessage = currentChat?.messages[index];
                  const activeVersionIdx =
                    storeMessage?.activeVersionIdx !== undefined ? storeMessage.activeVersionIdx : 0;
                  return (
                    <div key={index} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                      {!isUser && (
                        <div className="hidden sm:flex w-7 h-7 rounded-full bg-[#1a6adf]/15 border border-[#1a6adf]/30 dark:bg-[#60aaff]/15 dark:border-[#60aaff]/30 items-center justify-center flex-shrink-0 mt-1 select-none">
                          <div className="w-6 h-6 flex items-center justify-center">
                            <svg className="w-full h-full" viewBox="0 0 32 32" fill="none">
                              <defs>
                                <linearGradient id={`genesisGradMsg-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#3b82f6" />
                                  <stop offset="50%" stopColor="#60aaff" />
                                  <stop offset="100%" stopColor="#8b5cf6" />
                                </linearGradient>
                              </defs>
                              <path
                                d="M26 16C26 21.5228 21.5228 26 16 26C10.4772 26 6 21.5228 6 16C6 10.4772 10.4772 6 16 6C19.3431 6 22.2868 7.6393 24.1002 10.1584"
                                stroke={`url(#genesisGradMsg-${index})`}
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                              <path d="M16 16H25" stroke={`url(#genesisGradMsg-${index})`} strokeWidth="2.5" strokeLinecap="round" />
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
                              ? 'bg-[#1a6adf] dark:bg-[#60aaff]/10 border-transparent dark:border-[#60aaff]/20 text-white dark:text-[#b8d4ff]'
                              : 'glass-panel text-[#0a1628] dark:text-gray-100'
                          }`}
                        >
                          {isUser ? (
                            editingMessageId === storeMessage?.id && storeMessage ? (
                              <div className="space-y-2 min-w-[220px]">
                                <textarea
                                  value={editingMessageText}
                                  onChange={(e) => setEditingMessageText(e.target.value)}
                                  className="w-full min-h-[60px] p-2 rounded-md border border-slate-300 dark:border-white/10 bg-white dark:bg-[#1a1525] text-sm text-gray-900 dark:text-white resize-y"
                                  autoFocus
                                />
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => handleSaveHomeEdit(storeMessage.id, index)}
                                    className="px-2.5 py-1 bg-white text-black rounded text-xs font-semibold hover:bg-gray-100"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingMessageId(null)}
                                    className="px-2.5 py-1 border border-white/20 rounded text-xs font-semibold text-white/80 hover:bg-white/10"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                {msg.images && msg.images.length > 0 && (
                                  <div className="mb-2">
                                    {msg.images.map((imgUrl: string, imgIdx: number) => (
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
                                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-left">
                                    {msg.content}
                                  </div>
                                )}
                              </div>
                            )
                          ) : (
                            renderAiMessage(msg.content, index)
                          )}
                        </div>

                        <div
                          className={`flex items-center gap-2.5 px-1 mt-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150 select-none text-[11px] ${isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className="relative group/tooltip flex items-center gap-1 cursor-default text-[10px] text-gray-400 dark:text-gray-500">
                            <span>
                              {formatMessageTimestamp(storeMessage?.timestamp || new Date())}
                            </span>
                            <div
                              className={`absolute bottom-full mb-1 hidden group-hover/tooltip:block bg-gray-900 dark:bg-popover border border-slate-700 dark:border-white/10 text-white dark:text-popover-foreground text-[10px] rounded px-2 py-1 shadow-md whitespace-nowrap z-50 ${isUser ? 'right-0' : 'left-0'}`}
                            >
                              {new Date(storeMessage?.timestamp || new Date()).toLocaleDateString('en-US', {
                                dateStyle: 'medium',
                              })}
                              ,{' '}
                              {new Date(storeMessage?.timestamp || new Date()).toLocaleTimeString('en-US', {
                                timeStyle: 'short',
                              })}{' '}
                              — {isUser ? 'you' : 'assistant'}
                            </div>
                          </div>

                          <span className="text-gray-300 dark:text-white/5 select-none">|</span>

                          {storeMessage?.versions && storeMessage.versions.length > 1 && (
                            <>
                              <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded px-1.5 py-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                                <button
                                  disabled={activeVersionIdx === 0}
                                  onClick={() => onSwitchVersionIdx(storeMessage.id, activeVersionIdx - 1)}
                                  className="hover:text-[#1a6adf] dark:hover:text-white disabled:opacity-30 cursor-pointer"
                                >
                                  <ChevronLeft size={10} />
                                </button>
                                <span className="font-mono">
                                  {activeVersionIdx + 1} / {storeMessage.versions.length}
                                </span>
                                <button
                                  disabled={activeVersionIdx === storeMessage.versions.length - 1}
                                  onClick={() => onSwitchVersionIdx(storeMessage.id, activeVersionIdx + 1)}
                                  className="hover:text-[#1a6adf] dark:hover:text-white disabled:opacity-30 cursor-pointer"
                                >
                                  <ChevronRight size={10} />
                                </button>
                              </div>
                              <span className="text-gray-300 dark:text-white/5 select-none">|</span>
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
                              onClick={() => onRegenerate(storeMessage.id)}
                              className="hover:text-[#1a6adf] dark:hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                              title="Retry generation"
                            >
                              {regeneratingId === storeMessage.id ? (
                                <Loader2 className="animate-spin" size={11} />
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
                    <div className="bg-gray-100 dark:bg-white/5 p-4 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-600 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-600 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-600 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">Creating...</span>
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
                  value={ui.inputMessage}
                  onChange={(e) => ui.setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (!isLoading) onSendMessage();
                    }
                  }}
                  disabled={isLoading}
                  placeholder="How can I help you today?"
                  className="w-full bg-transparent border-0 outline-none resize-none min-h-[36px] max-h-[150px] text-[15px] leading-relaxed text-[#0a1628] dark:text-white placeholder-[#5580bb] dark:placeholder-gray-500 disabled:opacity-50"
                  rows={1}
                  ref={chatInputRef}
                />
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#1e468c]/12 dark:border-white/5">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading || isUploading || attachedImages.length >= FILE_UPLOAD_CONFIG.maxFiles}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
                      title="Attach image"
                    >
                      {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
                    </button>
                    {attachedImages.length > 0 && (
                      <span className="text-[10px] text-gray-400">
                        {attachedImages.length}/{FILE_UPLOAD_CONFIG.maxFiles}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative" ref={modelDropdownRef}>
                      <button
                        onClick={() => {
                          if (!preferences.developerMode) {
                            toast({
                              title: 'Developer Mode Required',
                              description: 'Enable Developer Mode to select a model.',
                              variant: 'destructive',
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
                            ? AI_MODELS[selectedModel]?.name || selectedModel
                            : 'Auto'}
                        </span>
                        <ChevronDown size={12} className={`stroke-[2] transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isModelDropdownOpen && (
                        <div className="absolute bottom-full left-0 mb-2 w-56 bg-white dark:bg-[#151121] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl py-1.5 z-50 animate-fade-in">
                          <div className="px-3 py-1 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-white/5 mb-1">
                            Select Model
                          </div>
                          {Object.entries(AI_MODELS).map(([modelId, m]) => (
                            <button
                              key={modelId}
                              onClick={() => {
                                setSelectedModel(modelId as AIModel);
                                setIsModelDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex items-center justify-between text-xs cursor-pointer ${selectedModel === modelId ? 'text-[#1a6adf] dark:text-[#60aaff] font-medium' : 'text-gray-700 dark:text-gray-300'}`}
                            >
                              <span>{m.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => onSendMessage()}
                      disabled={isLoading || (!ui.inputMessage.trim() && attachedImages.length === 0)}
                      className="p-2.5 bg-[#1a6adf] dark:bg-white text-white dark:text-black hover:opacity-95 rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Send size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Floating mobile chat input overlay when previewing */}
      {ui.showMobileChatInput && ui.showArtifact && (
        <div className="block sm:hidden absolute bottom-6 left-4 right-4 z-30 p-3 bg-[#fffaf0]/92 dark:bg-[#0f0a1e]/94 border border-[#1e468c]/15 dark:border-white/15 rounded-2xl backdrop-blur-md shadow-[0_10px_35px_rgba(26,106,223,0.15)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.55)] animate-fade-in">
          <div className="flex flex-col">
            <textarea
              value={ui.inputMessage}
              onChange={(e) => ui.setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!isLoading && ui.inputMessage.trim()) {
                    onSendMessage();
                    ui.setShowMobileChatInput(false);
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
                      onStopGeneration();
                      ui.setShowMobileChatInput(false);
                    }}
                    className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
                    title="Stop Generation"
                  >
                    <Square size={12} className="fill-white" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (!isLoading && ui.inputMessage.trim()) {
                        onSendMessage();
                        ui.setShowMobileChatInput(false);
                      }
                    }}
                    disabled={isLoading || !ui.inputMessage.trim()}
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
  );
};
