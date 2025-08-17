import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Message, TranscriptInfo } from '../types';
import { translateText } from '../services/geminiService';
import { CheckCircleIcon, DocumentTextIcon, ReplyIcon, TrashIcon, FaceSmileIcon, UserCircleIcon, LocationMarkerIcon, PlayIcon, PauseIcon, PencilIcon, DotsHorizontalIcon, ForwardIcon, CheckIcon, XIcon, PinIcon, UnpinIcon, ClipboardDocumentIcon, ChatBubbleLeftIcon, ShareIcon, GlobeAltIcon, ClipboardDocumentListIcon } from './icons';

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😯', '😢', '😡'];

const USER_COLORS = ['text-green-400', 'text-blue-400', 'text-yellow-400', 'text-pink-400', 'text-purple-400', 'text-orange-400'];
const getUserColor = (userId: string) => {
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return USER_COLORS[hash % USER_COLORS.length];
};

const getAvatarUrl = (name: string, url?: string) => {
    if (url) return url;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=393B44&color=FFFFFF&rounded=true`;
}

const OnDemandTranslation: React.FC<{ originalText: string }> = ({ originalText }) => {
    const { user } = useAppContext();
    const [translatedText, setTranslatedText] = useState<string | null>(null);
    const [isTranslated, setIsTranslated] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);

    const handleToggleTranslation = async () => {
        if (isTranslated) {
            setIsTranslated(false);
            return;
        }

        if (translatedText) {
            setIsTranslated(true);
            return;
        }

        setIsTranslating(true);
        try {
            const translation = await translateText(originalText, user.settings?.translationLanguage || 'English');
            setTranslatedText(translation);
            setIsTranslated(true);
        } catch (error) {
            console.error("Translation failed:", error);
            setTranslatedText("Translation failed.");
        } finally {
            setIsTranslating(false);
        }
    };

    return (
        <div>
            <p className="whitespace-pre-wrap break-words">
                {isTranslated ? (translatedText || '...') : originalText}
            </p>
            <button onClick={handleToggleTranslation} disabled={isTranslating} className="text-xs text-highlight hover:underline mt-2 flex items-center gap-1 disabled:text-text-secondary">
                {isTranslating ? 'Translating...' : (isTranslated ? 'See original' : 'See translation')}
            </button>
        </div>
    );
};

interface MessageBubbleProps {
  message: Message;
  onReply: (message: Message) => void;
  onJumpToMessage: (messageId: string) => void;
  isInSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  onStartSelection: (id: string) => void;
  onStartForwarding: (id: string) => void;
  searchTerm: string;
  isCurrentResult: boolean;
  onImageClick: (message: Message) => void;
  onShowReactions: (message: Message) => void;
  onViewTranscript: (transcriptInfo: TranscriptInfo) => void;
}

const getPhotoUrlFromMessage = (message: Message): string => {
    if (message.fileInfo?.type.startsWith('image/') && message.fileInfo.url) {
        return message.fileInfo.url;
    }
    // Fallback for older data structure or different message types
    if (message.type === 'image') {
        return message.content;
    }
    return '';
};

const AudioPlayer: React.FC<{ src: string; duration: number }> = ({ src, duration }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);

    const togglePlay = useCallback(() => {
        if (!audioRef.current) return;
        const audio = audioRef.current;
        if (isPlaying) {
            audio.pause();
        } else {
            if (audio.ended) {
                audio.currentTime = 0;
            }
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    if (error.name !== 'AbortError') {
                        console.error("Audio playback error:", error);
                    }
                });
            }
        }
    }, [isPlaying]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            if (audio.duration > 0) {
                 setProgress((audio.currentTime / audio.duration) * 100);
            }
        };
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleEnded = () => {
            setIsPlaying(false);
            setProgress(0);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const formatDuration = (sec: number) => new Date(sec * 1000).toISOString().substr(14, 5);

    return (
        <div className="flex items-center space-x-3 w-64">
            <audio ref={audioRef} src={src} preload="metadata"></audio>
            <button onClick={togglePlay} className="p-2 rounded-full bg-highlight/80 hover:bg-highlight text-white">
                {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
            </button>
            <div className="flex-1 flex items-center space-x-2">
                 <div className="w-full h-1 bg-slate-500/50 rounded-full">
                    <div className="h-1 bg-white rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
                <span className="text-xs w-12 text-right">{formatDuration(duration)}</span>
            </div>
        </div>
    );
};

const HighlightedContent: React.FC<{ text: string; highlight: string; isCurrentUser: boolean }> = ({ text, highlight, isCurrentUser }) => {
    if (!highlight.trim() && isCurrentUser) {
        return <p className="whitespace-pre-wrap break-words">{text}</p>;
    }
     if (!highlight.trim() && !isCurrentUser) {
        return <OnDemandTranslation originalText={text} />;
    }

    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    const content = (
        <>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <span key={i} className="bg-yellow-500/50 rounded">{part}</span>
                ) : (
                    part
                )
            )}
        </>
    );
    
    if (isCurrentUser) {
        return <p className="whitespace-pre-wrap break-words">{content}</p>;
    }

    // This part is tricky. We can't easily combine highlighting and the OnDemandTranslation component.
    // For simplicity, if there's a search term, we'll just show the highlighted original text.
    return <p className="whitespace-pre-wrap break-words">{content}</p>;
};

const ReplyPreview: React.FC<{ message: Message; onJump: () => void; }> = ({ message, onJump }) => {
  const senderColor = getUserColor(message.senderId);
  return (
    <div
      className="relative bg-black/20 rounded-lg p-2 pl-4 mb-2 overflow-hidden cursor-pointer hover:bg-black/30 transition-colors"
      onClick={onJump}
      title="Jump to message"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${senderColor.replace('text-', 'bg-')}`}></div>
      <p className={`font-semibold text-sm ${senderColor}`}>{message.replyInfo?.senderName}</p>
      <p className="text-sm opacity-80 truncate">{message.replyInfo?.content}</p>
    </div>
  );
};

const MoreActionsPopover: React.FC<{
    onReply: () => void;
    onForward: () => void;
    onSelect: () => void;
    onEdit?: () => void;
    onDeleteForMe?: () => void;
    onDeleteForEveryone?: () => void;
    onCopy?: () => void;
    onPin?: () => void;
    isPinned?: boolean;
    onReplyPrivately?: () => void;
    isCurrentUser: boolean;
    anchorRef: React.RefObject<HTMLDivElement>;
}> = (props) => {
    const popoverRef = useRef<HTMLDivElement>(null);
    const [isPositionedAbove, setIsPositionedAbove] = useState(true);
    const PinOrUnpinIcon = props.isPinned ? UnpinIcon : PinIcon;

    useEffect(() => {
        if (props.anchorRef.current && popoverRef.current) {
            const anchorRect = props.anchorRef.current.getBoundingClientRect();
            const popoverHeight = popoverRef.current.offsetHeight;
            const spaceAbove = anchorRect.top;
            const spaceBelow = window.innerHeight - anchorRect.bottom;

            if (spaceAbove < popoverHeight && spaceBelow > spaceAbove) {
                setIsPositionedAbove(false);
            } else {
                setIsPositionedAbove(true);
            }
        }
    }, [props.anchorRef]);

    const verticalClasses = isPositionedAbove ? 'bottom-full mb-1' : 'top-full mt-1';
    const horizontalClasses = props.isCurrentUser ? 'right-0' : 'left-0';

    return (
        <div ref={popoverRef} className={`absolute ${verticalClasses} ${horizontalClasses} bg-primary rounded-lg shadow-xl border border-slate-600 w-56 py-1 z-30 animate-fade-in-fast`}>
            <button onClick={props.onReply} className="flex items-center w-full text-left px-3 py-2 hover:bg-secondary text-text-primary">
                <ReplyIcon className="w-5 h-5 mr-3"/> Reply
            </button>
            {props.onReplyPrivately && (
               <button onClick={props.onReplyPrivately} className="flex items-center w-full text-left px-3 py-2 hover:bg-secondary text-text-primary">
                  <ChatBubbleLeftIcon className="w-5 h-5 mr-3"/> Reply Privately
              </button>
            )}
            <button onClick={props.onForward} className="flex items-center w-full text-left px-3 py-2 hover:bg-secondary text-text-primary">
                <ShareIcon className="w-5 h-5 mr-3"/> Forward
            </button>
            {props.onCopy && (
                 <button onClick={props.onCopy} className="flex items-center w-full text-left px-3 py-2 hover:bg-secondary text-text-primary">
                    <ClipboardDocumentIcon className="w-5 h-5 mr-3"/> Copy
                </button>
            )}
            {props.onPin && (
                 <button onClick={props.onPin} className="flex items-center w-full text-left px-3 py-2 hover:bg-secondary text-text-primary">
                    <PinOrUnpinIcon className="w-5 h-5 mr-3"/> {props.isPinned ? 'Unpin' : 'Pin'}
                </button>
            )}
             <button onClick={props.onSelect} className="flex items-center w-full text-left px-3 py-2 hover:bg-secondary text-text-primary">
                <CheckIcon className="w-5 h-5 mr-3"/> Select
            </button>
            <div className="h-px bg-slate-600 my-1"></div>
            {props.onEdit && (
                <button onClick={props.onEdit} className="flex items-center w-full text-left px-3 py-2 hover:bg-secondary text-text-primary">
                    <PencilIcon className="w-5 h-5 mr-3"/> Edit
                </button>
            )}
            {props.onDeleteForMe && (
                 <button onClick={props.onDeleteForMe} className="flex items-center w-full text-left px-3 py-2 hover:bg-secondary text-text-primary">
                    <TrashIcon className="w-5 h-5 mr-3"/> Remove for Me
                </button>
            )}
            {props.onDeleteForEveryone && (
                 <button onClick={props.onDeleteForEveryone} className="flex items-center w-full text-left px-3 py-2 text-red-400 hover:bg-secondary hover:text-red-300">
                    <TrashIcon className="w-5 h-5 mr-3"/> Remove for Everyone
                </button>
            )}
        </div>
    );
};

const SelectionIndicator: React.FC<{ isSelected: boolean }> = ({ isSelected }) => (
    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors bg-secondary/50 backdrop-blur-sm ${isSelected ? 'bg-accent border-accent' : 'border-slate-500'}`}>
        {isSelected && <CheckIcon className="w-4 h-4 text-white" />}
    </div>
);

const MessageBubble = React.memo(React.forwardRef<HTMLDivElement, MessageBubbleProps>((props, ref) => {
    const {
        message,
        onReply,
        onJumpToMessage,
        isInSelectionMode,
        isSelected,
        onToggleSelection,
        onStartSelection,
        onStartForwarding,
        searchTerm,
        isCurrentResult,
        onImageClick,
        onShowReactions,
        onViewTranscript
    } = props;

    const { user, getContactById, activeChatId, chats, deleteMessage, toggleReaction, editMessage, copyToClipboard, togglePinMessage, replyPrivately, setActiveChatId, getOrCreatePrivateChat } = useAppContext();
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(message.content);

    const moreMenuRef = useRef<HTMLDivElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);

    const isCurrentUser = message.senderId === user.id;
    const activeChat = chats.find(c => c.id === activeChatId);
    const sender = getContactById(message.senderId);
    const alignmentClass = isCurrentUser ? 'items-end' : 'items-start';

    const handleBubbleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target instanceof HTMLAnchorElement || (e.target as HTMLElement).closest('button')) {
            return;
        }
        if (isInSelectionMode) {
            onToggleSelection(message.id);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
                setShowMoreMenu(false);
            }
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleStartEditing = () => {
        setIsEditing(true);
        setEditedContent(message.content);
        setShowMoreMenu(false);
    };
    const handleCancelEditing = () => setIsEditing(false);
    const handleSaveEditing = () => {
        if (editedContent.trim() && editedContent !== message.content) {
            if (activeChatId) editMessage({ chatId: activeChatId, messageId: message.id, newContent: editedContent });
        }
        setIsEditing(false);
    };

    const handleSenderNameClick = () => {
        if (sender) {
            const chatId = getOrCreatePrivateChat(sender.id);
            setActiveChatId(chatId);
        }
    };

    const isAnImage = useMemo(() => {
        return message.type === 'image' || (message.type === 'file' && !!message.fileInfo?.type.startsWith('image/'));
    }, [message.type, message.fileInfo]);

    const bubblePaddingClass = isAnImage ? 'p-1' : 'px-4 pt-3 pb-6';
    const bubbleBgClass = isAnImage ? 'bg-transparent' : isCurrentUser ? 'bg-accent' : 'bg-primary';
    const bubbleClasses = isCurrentUser ? `${bubbleBgClass} text-white rounded-br-lg` : `${bubbleBgClass} text-text-primary rounded-bl-lg`;

    if (isEditing) {
        return (
            <div ref={ref} className={`flex flex-col ${alignmentClass}`}>
                <div className={`flex items-center space-x-2 w-full max-w-lg bg-secondary p-2 rounded-lg ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <textarea
                        value={editedContent}
                        onChange={e => setEditedContent(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEditing(); }
                            if (e.key === 'Escape') { e.preventDefault(); handleCancelEditing(); }
                        }}
                        autoFocus
                        className="flex-1 bg-primary px-3 py-2 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-highlight resize-none transition-colors"
                        rows={1}
                        style={{ height: 'auto', overflowY: 'hidden' }}
                        onInput={(e) => {
                            const target = e.currentTarget;
                            target.style.height = 'auto';
                            target.style.height = `${target.scrollHeight}px`;
                        }}
                    />
                    <div className="flex items-center space-x-1">
                        <button onClick={handleCancelEditing} className="p-2 bg-secondary text-text-secondary hover:bg-slate-700 rounded-full transition-colors" aria-label="Cancel edit">
                            <XIcon className="w-6 h-6" />
                        </button>
                        <button onClick={handleSaveEditing} className="p-2 bg-accent text-white rounded-full hover:bg-highlight transition-colors" aria-label="Save changes">
                            <CheckIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (message.isDeleted) {
        return (
            <div ref={ref} className={`flex flex-col ${alignmentClass}`}>
                <div className="flex items-center space-x-2 max-w-[85%]">
                    <div className="px-4 py-3 rounded-2xl italic text-text-secondary bg-secondary">
                        This message was deleted
                    </div>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        switch (message.type) {
            case 'image': {
                const photoUrl = getPhotoUrlFromMessage(message);
                if (!photoUrl) return <div className="text-sm italic text-text-secondary">[Image not available]</div>;
                return <img src={photoUrl} alt="shared content" className="rounded-xl max-w-full max-h-80 object-contain cursor-pointer" onClick={() => onImageClick(message)} />;
            }
            case 'file': {
                if (message.fileInfo?.type.startsWith('video/')) {
                    return (
                        <video controls src={message.fileInfo.url} className="rounded-lg max-w-xs max-h-80">
                            Your browser does not support the video tag.
                        </video>
                    );
                }
                const photoUrl = getPhotoUrlFromMessage(message);
                if (photoUrl) {
                    return <img src={photoUrl} alt={message.fileInfo?.name || "shared image"} className="rounded-xl max-w-full max-h-80 object-contain cursor-pointer" onClick={() => onImageClick(message)} />;
                }
                return (
                    <a href={message.fileInfo?.url || '#'} download={message.fileInfo?.name} className="flex items-center space-x-3 bg-slate-500/50 p-3 rounded-lg hover:bg-slate-500/80 transition-colors max-w-xs">
                        <DocumentTextIcon className="w-8 h-8 flex-shrink-0 text-white" />
                        <div>
                            <p className="font-semibold break-all">{message.fileInfo?.name}</p>
                            <p className="text-sm opacity-80">{message.fileInfo?.size}</p>
                        </div>
                    </a>
                );
            }
            case 'contact':
                return (
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-500/50 max-w-xs">
                        <UserCircleIcon className="w-10 h-10 flex-shrink-0 text-white" />
                        <div>
                            <p className="font-semibold">{message.contactInfo?.name}</p>
                            <p className="text-sm opacity-80">Contact Card</p>
                        </div>
                    </div>
                );
            case 'location':
                const { latitude, longitude, address } = message.locationInfo || {};
                if (latitude === undefined || longitude === undefined) return null;
                const mapUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;
                const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}&layer=mapnik&marker=${latitude},${longitude}`;
                return (
                    <div className="max-w-xs rounded-lg overflow-hidden bg-secondary shadow-md">
                        <a href={mapUrl} target="_blank" rel="noopener noreferrer" aria-label={`View location ${address} on OpenStreetMap`}>
                            <iframe src={mapEmbedUrl} className="w-full h-48 border-none" loading="lazy" referrerPolicy="no-referrer" title={`Map of ${address}`}></iframe>
                        </a>
                        <div className="p-3">
                            <p className="font-semibold text-text-primary truncate" title={address || 'Shared Location'}>{address || 'Shared Location'}</p>
                            <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-highlight hover:underline">View on OpenStreetMap</a>
                        </div>
                    </div>
                );
            case 'audio':
                if (!message.audioInfo) return null;
                return <AudioPlayer src={message.audioInfo.url} duration={message.audioInfo.duration} />;
            case 'transcript':
                return (
                    <button
                        onClick={() => message.transcriptInfo && onViewTranscript(message.transcriptInfo)}
                        className="flex flex-col space-y-2 bg-slate-500/50 p-3 rounded-lg hover:bg-slate-500/80 transition-colors max-w-xs w-full text-left"
                    >
                        <div className="flex items-center space-x-3">
                            <ClipboardDocumentListIcon className="w-8 h-8 flex-shrink-0 text-white" />
                            <div>
                                <p className="font-semibold break-all">Meeting Transcript</p>
                                <p className="text-sm opacity-80 truncate">{message.transcriptInfo?.title}</p>
                            </div>
                        </div>
                        <span className="text-sm font-semibold text-highlight self-start">View full transcript</span>
                    </button>
                );
            case 'text':
                return <HighlightedContent text={message.content} highlight={searchTerm} isCurrentUser={isCurrentUser} />;
        }
    };

    const renderActions = () => (
        <div className={`flex items-center self-end space-x-1 flex-shrink-0 mb-2`}>
            {!isCurrentUser && (
                <div ref={emojiPickerRef} className="relative">
                    <button onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(p => !p); }} className="p-1.5 text-accent hover:text-highlight rounded-full transition-colors">
                        <FaceSmileIcon className="w-5 h-5" />
                    </button>
                    {showEmojiPicker && (
                        <div className="absolute bottom-full mb-1 flex space-x-1 bg-primary p-2 rounded-xl shadow-lg border border-slate-600">
                            {EMOJI_REACTIONS.map(emoji => (
                                <button key={emoji} onClick={(e) => { e.stopPropagation(); if (activeChatId) { toggleReaction({ chatId: activeChatId, messageId: message.id, emoji }); setShowEmojiPicker(false); } }} className="text-2xl p-1 rounded-full hover:bg-highlight/20 transition-transform transform hover:scale-125">{emoji}</button>
                            ))}
                        </div>
                    )}
                </div>
            )}
            <div ref={moreMenuRef} className="relative">
                <button onClick={(e) => { e.stopPropagation(); setShowMoreMenu(p => !p); }} className="p-1.5 text-accent hover:text-highlight rounded-full transition-colors">
                    <DotsHorizontalIcon className="w-5 h-5" />
                </button>
                {showMoreMenu && activeChatId && (
                    <MoreActionsPopover
                        anchorRef={moreMenuRef}
                        isCurrentUser={isCurrentUser}
                        onReply={() => { onReply(message); setShowMoreMenu(false); }}
                        onForward={() => { onStartForwarding(message.id); setShowMoreMenu(false); }}
                        onSelect={() => { onStartSelection(message.id); setShowMoreMenu(false); }}
                        onEdit={isCurrentUser && message.type === 'text' ? handleStartEditing : undefined}
                        onDeleteForMe={isCurrentUser ? () => { deleteMessage({ chatId: activeChatId, messageId: message.id, forEveryone: false }); setShowMoreMenu(false); } : undefined}
                        onDeleteForEveryone={isCurrentUser ? () => { deleteMessage({ chatId: activeChatId, messageId: message.id, forEveryone: true }); setShowMoreMenu(false); } : undefined}
                        onCopy={message.type === 'text' ? () => { copyToClipboard(message.content); setShowMoreMenu(false); } : undefined}
                        onPin={() => { togglePinMessage({ chatId: activeChatId, messageId: message.id }); setShowMoreMenu(false); }}
                        isPinned={activeChat?.pinnedMessages?.includes(message.id)}
                        onReplyPrivately={activeChat?.type === 'group' && !isCurrentUser ? () => { replyPrivately({ sourceChatId: activeChatId, messageId: message.id }); setShowMoreMenu(false); } : undefined}
                    />
                )}
            </div>
        </div>
    );

    const bubbleContent = (
        <div className={`flex flex-col ${alignmentClass} message-actions-container`}>
            {activeChat?.type === 'group' && !isCurrentUser && (
                <button onClick={handleSenderNameClick} className={`text-sm font-semibold mb-1 ml-12 ${getUserColor(message.senderId)} hover:underline`}>
                    {sender?.name}
                </button>
            )}
            <div className="flex items-end space-x-2 max-w-[85%]">
                {isCurrentUser && !isInSelectionMode && !isAnImage && renderActions()}
                {!isCurrentUser && (<img src={getAvatarUrl(sender?.name || '?', sender?.avatar)} alt={sender?.name} className="w-8 h-8 rounded-full self-end" />)}
                <div
                    className={`relative ${bubblePaddingClass} rounded-2xl transition-all duration-200 min-w-[80px] max-w-lg ${bubbleClasses} ${isCurrentResult ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-secondary' : ''}`}
                    onClick={handleBubbleClick}
                >
                    {message.replyInfo && (
                        <ReplyPreview
                            message={message}
                            onJump={() => onJumpToMessage(message.replyInfo!.messageId)}
                        />
                    )}
                    {renderContent()}
                    <div className={`absolute bottom-1.5 right-1.5 flex items-center space-x-1.5 text-xs ${isAnImage ? 'bg-black/60 text-white/90 rounded-full px-2 py-1 backdrop-blur-sm' : isCurrentUser ? 'text-white/90' : 'text-text-secondary'}`}>
                        {message.isEdited && <span className="mr-1.5">Edited</span>}
                        <p>
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: user.settings?.timezone }).toLowerCase()}
                        </p>
                        {isCurrentUser && message.read && <CheckCircleIcon className={`w-4 h-4 ${isAnImage ? 'text-white' : 'text-white'}`} />}
                    </div>
                </div>
                {!isCurrentUser && !isInSelectionMode && !isAnImage && renderActions()}
            </div>
            {message.reactions && Object.keys(message.reactions).length > 0 && !isInSelectionMode && (
                <button
                    onClick={() => onShowReactions(message)}
                    className={`mt-2 flex items-center space-x-1 z-10 p-1 rounded-full bg-secondary hover:bg-slate-600 transition-colors ${isCurrentUser ? 'self-end mr-8' : 'self-start ml-12'}`}
                    aria-label="View reactions"
                >
                    {Object.entries(message.reactions).slice(0, 3).map(([emoji, userIds]) =>
                        userIds.length > 0 && <span key={emoji} className="text-sm">{emoji}</span>
                    )}
                    <span className="text-xs font-semibold text-text-secondary px-1">
                        {Object.values(message.reactions).reduce((total, userIds) => total + userIds.length, 0)}
                    </span>
                </button>
            )}
        </div>
    );

    return (
        <div ref={ref} className="flex items-center w-full cursor-pointer group/message-row" onClick={handleBubbleClick}>
            <div className="flex-1 min-w-0">
                <div className="relative">
                    {bubbleContent}
                    {isAnImage && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/message-row:opacity-100 transition-opacity">
                            <div className="flex items-center space-x-2 bg-black/50 backdrop-blur-sm p-1 rounded-full">
                                {renderActions()}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {isInSelectionMode && (
                <div className="w-8 flex-shrink-0 self-center ml-2">
                    <SelectionIndicator isSelected={isSelected} />
                </div>
            )}
        </div>
    );
}));

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;