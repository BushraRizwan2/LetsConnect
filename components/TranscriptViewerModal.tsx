import React from 'react';
import { TranscriptInfo } from '../types';
import { XIcon, ClipboardDocumentListIcon } from './icons';
import { useAppContext } from '../context/AppContext';

interface TranscriptViewerModalProps {
    transcriptInfo: TranscriptInfo;
    onClose: () => void;
}

const getAvatarUrl = (name: string, url?: string) => {
    if (url) return url;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=393B44&color=FFFFFF&rounded=true`;
};

const MarkdownText: React.FC<{ text: string }> = React.memo(({ text }) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
        <>
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i}>{part.slice(2, -2)}</strong>;
                }
                return part;
            })}
        </>
    );
});

export const TranscriptViewerModal: React.FC<TranscriptViewerModalProps> = ({ transcriptInfo, onClose }) => {
    const { getContactById, user } = useAppContext();

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: user.settings?.timezone });
    };

    return (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-primary rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-slate-700 flex-shrink-0 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <ClipboardDocumentListIcon className="w-6 h-6 text-highlight" />
                        <div>
                            <h3 className="text-xl font-bold">Meeting Transcript</h3>
                            <p className="text-sm text-text-secondary truncate">{transcriptInfo.title}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 text-text-secondary hover:text-white">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {transcriptInfo.entries.map((entry, index) => {
                         const speaker = getContactById(entry.speakerId);
                         return (
                            <div key={`${entry.speakerId}-${index}`} className="flex items-start space-x-4">
                                <img src={getAvatarUrl(entry.speakerName, speaker?.avatar)} alt={entry.speakerName} className="w-10 h-10 rounded-full" />
                                <div className="flex-1">
                                    <div className="flex items-baseline space-x-2">
                                        <p className="font-bold text-blue-400">{entry.speakerName}</p>
                                        <p className="text-xs text-text-secondary">{formatTimestamp(entry.timestamp)}</p>
                                    </div>
                                    <p className="text-text-primary whitespace-pre-wrap mt-1">{entry.text}</p>
                                    {entry.translatedText && (
                                        <p className="text-text-primary mt-1 whitespace-pre-wrap"><MarkdownText text={entry.translatedText} /></p>
                                    )}
                                </div>
                            </div>
                         );
                    })}
                </div>
            </div>
        </div>
    );
};