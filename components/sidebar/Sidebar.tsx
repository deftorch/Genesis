'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, MessageSquare, Star, Trash2, MoreVertical, Edit2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { useChatStore } from '@/lib/store/chat-store';
import { cn, formatDate } from '@/lib/utils';
import { Chat } from '@/types';

interface ChatItemProps {
  chat: Chat;
  isActive: boolean;
  isOpen: boolean;
  isEditing: boolean;
  editTitle: string;
  setEditTitle: (val: string) => void;
  showOptions: boolean;
  setShowOptions: (show: boolean) => void;
  onSelect: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onStar: (e: React.MouseEvent) => void;
  onStartEdit: (e: React.MouseEvent) => void;
  onDeleteClick: (e: React.MouseEvent) => void;
}

const ChatItem: React.FC<ChatItemProps> = ({
  chat,
  isActive,
  isOpen,
  isEditing,
  editTitle,
  setEditTitle,
  showOptions,
  setShowOptions,
  onSelect,
  onSaveEdit,
  onCancelEdit,
  onStar,
  onStartEdit,
  onDeleteClick,
}) => {
  return (
    <div
      className={cn(
        'group relative flex items-center gap-2 rounded-md cursor-pointer transition-all duration-200',
        isActive 
          ? 'bg-primary/10 border border-primary/20' 
          : 'hover:bg-muted/50 border border-transparent',
        'mb-1',
        isOpen ? 'px-3 py-2.5' : 'lg:px-2 lg:py-2 lg:justify-center px-3 py-2.5'
      )}
      onClick={() => !isEditing && onSelect()}
      title={!isOpen ? chat.title : undefined}
    >
      <MessageSquare className={cn(
        "h-4 w-4 shrink-0",
        isActive ? "text-primary" : "text-muted-foreground"
      )} />
      
      {isOpen && (
        <>
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSaveEdit();
                  if (e.key === 'Escape') onCancelEdit();
                }}
                onBlur={onSaveEdit}
                className="w-full px-2 py-1 text-sm bg-background border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <div className={cn(
                  "text-sm font-medium truncate",
                  isActive && "text-primary"
                )}>
                  {chat.title}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(chat.updatedAt)}
                </div>
              </>
            )}
          </div>

          {!isEditing && (
            <div className="flex items-center gap-1 shrink-0">
              {chat.isStarred && (
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              )}
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOptions(!showOptions);
                }}
                className={cn(
                  "p-1.5 hover:bg-muted rounded transition-opacity",
                  "opacity-0 group-hover:opacity-100"
                )}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Options Menu */}
      {showOptions && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={(e) => {
              e.stopPropagation();
              setShowOptions(false);
            }}
          />
          <div className="absolute right-0 top-full mt-1 w-44 bg-popover border rounded-md shadow-lg z-20 py-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => onStar(e)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 transition-colors"
            >
              <Star className="h-4 w-4" />
              {chat.isStarred ? 'Remove star' : 'Add star'}
            </button>
            <button
              onClick={(e) => onStartEdit(e)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 transition-colors"
            >
              <Edit2 className="h-4 w-4" />
              Rename
            </button>
            <div className="my-1 border-t" />
            <button
              onClick={(e) => onDeleteClick(e)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-destructive/10 text-destructive flex items-center gap-2 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showOptions, setShowOptions] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState('');
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [chatToDelete, setChatToDelete] = React.useState<string | null>(null);

  const {
    chats,
    currentChatId,
    createChat,
    deleteChat,
    renameChat,
    starChat,
    setCurrentChat,
    searchChats,
  } = useChatStore();

  const filteredChats = searchQuery
    ? searchChats(searchQuery)
    : chats;

  const starredChats = filteredChats.filter((chat) => chat.isStarred);
  const regularChats = filteredChats.filter((chat) => !chat.isStarred);

  const handleNewChat = () => {
    const newChatId = createChat();
    // Navigate to new chat
    router.push(`/chat/${newChatId}`);
    // Don't close sidebar on desktop
    if (window.innerWidth < 1024) {
      onClose?.();
    }
  };

  const handleSelectChat = (chatId: string) => {
    setCurrentChat(chatId);
    // Navigate to selected chat
    router.push(`/chat/${chatId}`);
    // Don't close sidebar on desktop
    if (window.innerWidth < 1024) {
      onClose?.();
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    setChatToDelete(chatId);
    setDeleteModalOpen(true);
    setShowOptions(null);
  };

  const handleConfirmDelete = () => {
    if (chatToDelete) {
      deleteChat(chatToDelete);
      setChatToDelete(null);
    }
  };

  const handleStarChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    starChat(chatId);
    setShowOptions(null);
  };

  const handleStartEdit = (e: React.MouseEvent, chat: Chat) => {
    e.stopPropagation();
    setEditingId(chat.id);
    setEditTitle(chat.title);
    setShowOptions(null);
  };

  const handleSaveEdit = (chatId: string) => {
    if (editTitle.trim()) {
      renameChat(chatId, editTitle);
    }
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  return (
    <div className={cn(
      "fixed lg:relative inset-y-0 left-0 z-40",
      "flex flex-col h-full bg-background",
      "border-r border-border",
      "transform transition-all duration-300 ease-in-out",
      // Mobile: slide in/out completely
      // Desktop: collapse to icon width (16) or full width (72)
      isOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0 lg:w-16"
    )}>
      {/* Mobile Close Button */}
      <div className="lg:hidden absolute top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Header */}
      <div className={cn(
        "p-4 border-b",
        !isOpen && "lg:p-2"
      )}>
        <Button 
          onClick={handleNewChat} 
          className={cn(
            "w-full h-10 bg-primary hover:bg-primary/90",
            isOpen ? "justify-center gap-2" : "justify-center lg:w-10 lg:p-0"
          )}
        >
          <Plus className="h-4 w-4" />
          {isOpen && <span className="font-medium lg:inline">New Chat</span>}
        </Button>
      </div>

      {/* Search */}
      {isOpen && (
        <div className="p-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="pl-9 h-9 bg-muted/50"
            />
          </div>
        </div>
      )}

      {/* Chat List */}
      <div className={cn(
        "flex-1 overflow-y-auto scrollbar-thin",
        isOpen ? "px-3 py-2" : "lg:px-1 lg:py-2 px-3 py-2"
      )}>
        {/* Starred Chats */}
        {starredChats.length > 0 && (
          <div className="mb-3">
            {isOpen && (
              <div className="flex items-center gap-2 px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <Star className="h-3 w-3" />
                Favorites
              </div>
            )}
            <div className="space-y-0.5">
              {starredChats.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isActive={chat.id === currentChatId}
                  isOpen={isOpen}
                  isEditing={editingId === chat.id}
                  editTitle={editTitle}
                  setEditTitle={setEditTitle}
                  showOptions={showOptions === chat.id}
                  setShowOptions={(show) => setShowOptions(show ? chat.id : null)}
                  onSelect={() => handleSelectChat(chat.id)}
                  onSaveEdit={() => handleSaveEdit(chat.id)}
                  onCancelEdit={handleCancelEdit}
                  onStar={(e) => handleStarChat(e, chat.id)}
                  onStartEdit={(e) => handleStartEdit(e, chat)}
                  onDeleteClick={(e) => handleDeleteClick(e, chat.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Regular Chats */}
        {regularChats.length > 0 && (
          <div>
            {starredChats.length > 0 && isOpen && (
              <div className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Recent
              </div>
            )}
            <div className="space-y-0.5">
              {regularChats.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isActive={chat.id === currentChatId}
                  isOpen={isOpen}
                  isEditing={editingId === chat.id}
                  editTitle={editTitle}
                  setEditTitle={setEditTitle}
                  showOptions={showOptions === chat.id}
                  setShowOptions={(show) => setShowOptions(show ? chat.id : null)}
                  onSelect={() => handleSelectChat(chat.id)}
                  onSaveEdit={() => handleSaveEdit(chat.id)}
                  onCancelEdit={handleCancelEdit}
                  onStar={(e) => handleStarChat(e, chat.id)}
                  onStartEdit={(e) => handleStartEdit(e, chat)}
                  onDeleteClick={(e) => handleDeleteClick(e, chat.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredChats.length === 0 && isOpen && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              {searchQuery ? 'No results found' : 'Start a conversation'}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              {searchQuery 
                ? 'Try different keywords' 
                : 'Create your first chat to get started'}
            </p>
            {!searchQuery && (
              <Button 
                onClick={handleNewChat} 
                variant="outline" 
                size="sm"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                New Chat
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Chat"
        message="Are you sure you want to delete this chat? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        icon="delete"
      />
    </div>
  );
};
