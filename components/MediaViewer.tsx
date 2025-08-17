
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message } from '../types';
import { useAppContext } from '../context/AppContext';
import { XIcon, ChevronLeftIcon, ChevronRightIcon, ArrowDownTrayIcon, ShareIcon, TrashIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon } from './icons';

interface MediaViewerProps {
    messages: Message[];
    initialIndex: number;
    onClose: () => void;
    onDelete?: (messageId: string, forEveryone: boolean) => void;
    onForward?: (messageId: string) => void;
}

const getPhotoUrl = (message: Message): string => {
    if (message.type === 'image') return message.content;
    if (message.type === 'file' && message.fileInfo?.type.startsWith('image/')) {
        return message.fileInfo.url;
    }
    return '';
};

export const MediaViewer: React.FC<MediaViewerProps> = ({ messages, initialIndex, onClose, onDelete, onForward }) => {
    const { getContactById } = useAppContext();
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isMaximized, setIsMaximized] = useState(false);
    const filmstripRef = useRef<HTMLDivElement>(null);

    const currentMessage = messages[currentIndex];
    const sender = getContactById(currentMessage.senderId);

    const goToNext = useCallback(() => {
        setCurrentIndex(prev => (prev + 1) % messages.length);
    }, [messages.length]);

    const goToPrev = useCallback(() => {
        setCurrentIndex(prev => (prev - 1 + messages.length) % messages.length);
    }, [messages.length]);
    
    const handleDownload = useCallback(async (messageToDownload: Message) => {
        const url = getPhotoUrl(messageToDownload);
        const name = messageToDownload.fileInfo?.name || `download-${messageToDownload.id}.png`;
        
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', name);
            document.body.appendChild(link);
            link.click();
            
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Download failed.');
        }
    }, []);

    const handleDownloadAll = useCallback(async () => {
        // This is a simplified approach. A real implementation might use a library like JSZip.
        alert(`Starting download for ${messages.length} images.`);
        for (const message of messages) {
            await handleDownload(message);
            // Add a small delay to prevent browser from blocking multiple downloads
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }, [messages, handleDownload]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') goToNext();
            if (e.key === 'ArrowLeft') goToPrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, goToNext, goToPrev]);

    useEffect(() => {
        const filmstrip = filmstripRef.current;
        const activeThumbnail = filmstrip?.querySelector(`[data-index="${currentIndex}"]`) as HTMLElement;
        if (filmstrip && activeThumbnail) {
            filmstrip.scrollTo({
                left: activeThumbnail.offsetLeft - (filmstrip.offsetWidth / 2) + (activeThumbnail.offsetWidth / 2),
                behavior: 'smooth',
            });
        }
    }, [currentIndex]);
    
    if (!currentMessage) return null;

    const mainContainerClasses = isMaximized
        ? "fixed inset-0 bg-black z-[60] flex flex-col items-center justify-center p-0"
        : "fixed inset-0 bg-black/80 z-[60] flex flex-col items-center justify-center p-4";

    return (
        <div className={`${mainContainerClasses} animate-fade-in-fast`} onClick={onClose}>
            <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center text-white bg-gradient-to-b from-black/50 to-transparent z-10">
                 <div className="flex items-center space-x-3">
                    {sender && <img src={sender.avatar} alt={sender.name} className="w-10 h-10 rounded-full" />}
                    <div>
                        <p className="font-bold">{sender?.name}</p>
                        <p className="text-sm opacity-80">{new Date(currentMessage.timestamp).toLocaleString()}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                     <button onClick={(e) => { e.stopPropagation(); handleDownload(currentMessage); }} className="p-2 hover:bg-white/20 rounded-full transition-colors" title="Download">
                        <ArrowDownTrayIcon className="w-6 h-6" />
                    </button>
                    {messages.length > 1 && (
                         <button onClick={(e) => { e.stopPropagation(); handleDownloadAll(); }} className="relative p-2 hover:bg-white/20 rounded-full transition-colors" title="Download All">
                            <ArrowDownTrayIcon className="w-6 h-6" />
                            <span className="absolute -bottom-1 -right-1 text-xs bg-highlight rounded-full px-1 font-bold">All</span>
                        </button>
                    )}
                    {onForward && (
                        <button onClick={(e) => { e.stopPropagation(); onForward(currentMessage.id); }} className="p-2 hover:bg-white/20 rounded-full transition-colors" title="Forward">
                            <ShareIcon className="w-6 h-6" />
                        </button>
                    )}
                    {onDelete && (
                        <button onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this message for everyone?')) {
                                onDelete(currentMessage.id, true);
                            }
                        }} className="p-2 hover:bg-white/20 rounded-full transition-colors" title="Delete">
                            <TrashIcon className="w-6 h-6" />
                        </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); setIsMaximized(p => !p); }} className="p-2 hover:bg-white/20 rounded-full transition-colors" title={isMaximized ? "Minimize" : "Maximize"}>
                        {isMaximized ? <ArrowsPointingInIcon className="w-6 h-6"/> : <ArrowsPointingOutIcon className="w-6 h-6" />}
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors" title="Close">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
            </header>

            <main className="flex-1 w-full flex items-center justify-between relative overflow-hidden my-4">
                 {messages.length > 1 && (
                    <button onClick={(e) => { e.stopPropagation(); goToPrev(); }} className="absolute left-4 p-2 bg-black/40 rounded-full text-white hover:bg-black/70 z-10">
                        <ChevronLeftIcon className="w-8 h-8"/>
                    </button>
                )}
                <div className="w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
                    <img src={getPhotoUrl(currentMessage)} alt="Media content" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
                </div>
                {messages.length > 1 && (
                    <button onClick={(e) => { e.stopPropagation(); goToNext(); }} className="absolute right-4 p-2 bg-black/40 rounded-full text-white hover:bg-black/70 z-10">
                        <ChevronRightIcon className="w-8 h-8"/>
                    </button>
                 )}
            </main>
            
            {!isMaximized && messages.length > 1 && (
                <footer className="w-full h-28 flex-shrink-0 flex items-center justify-center" onClick={e => e.stopPropagation()}>
                    <div ref={filmstripRef} className="flex items-center space-x-2 overflow-x-auto p-2">
                        {messages.map((msg, index) => (
                            <img
                                key={msg.id}
                                data-index={index}
                                src={getPhotoUrl(msg)}
                                alt={`Thumbnail ${index + 1}`}
                                onClick={(e) => {e.stopPropagation(); setCurrentIndex(index);}}
                                className={`h-20 aspect-square object-cover rounded-md cursor-pointer transition-all duration-200 ${currentIndex === index ? 'ring-2 ring-highlight scale-105' : 'opacity-60 hover:opacity-100'}`}
                            />
                        ))}
                    </div>
                </footer>
            )}
        </div>
    );
};
