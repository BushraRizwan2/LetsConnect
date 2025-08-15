import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { generateAvatar } from '../services/geminiService';
import { XIcon, ArrowUpTrayIcon, TrashIcon, SparklesIcon, ChevronLeftIcon, CameraIcon, CheckIcon, PencilIcon } from './icons';

export const ProfilePictureModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { user, updateUserAvatar } = useAppContext();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const ignoreBackdropClickRef = useRef(false);

    const [view, setView] = useState<'edit' | 'ai' | 'capture' | 'preview'>('edit');
    const [isZoomed, setIsZoomed] = useState(false);
    
    // AI State
    const [prompt, setPrompt] = useState('a smiling, friendly robot');
    const [generatedAvatar, setGeneratedAvatar] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Capture state
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Preview state for uploaded image
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (ignoreBackdropClickRef.current) {
            ignoreBackdropClickRef.current = false;
            return;
        }
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const openFileDialog = () => {
        ignoreBackdropClickRef.current = true;
        fileInputRef.current?.click();
    };
    
    const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
        setError('');
        const file = event.target.files?.[0];
        event.currentTarget.value = '';

        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file.');
            return;
        }

        const reader = new FileReader();
        reader.onerror = () => setError('Could not read the file. It might be corrupted.');
        reader.onload = (readerEvent) => {
            const imageDataUrl = readerEvent.target?.result as string;
            if (!imageDataUrl) {
                setError('Failed to read image data.');
                return;
            }
            const img = new Image();
            img.onerror = () => setError('The selected file is not a valid image.');
            img.onload = () => {
                setPreviewImage(imageDataUrl);
                setView('preview');
            };
            img.src = imageDataUrl;
        };
        reader.readAsDataURL(file);
    };
    
    const handleRemovePicture = () => {
        updateUserAvatar(null);
        onClose();
    };

    const handleGenerateClick = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setError('');
        setGeneratedAvatar(null);
        try {
            const avatarUrl = await generateAvatar(prompt);
            setGeneratedAvatar(avatarUrl);
        } catch (e) {
            setError('Could not generate avatar. Please try again.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSetGeneratedAvatar = () => {
        if (generatedAvatar) {
            updateUserAvatar(generatedAvatar);
            onClose();
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("Could not access camera. Please check permissions.");
            setView('edit');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const handleCapture = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/png');
            setCapturedImage(dataUrl);
            stopCamera();
        }
    };

    const handleConfirmCapture = () => {
        if (capturedImage) {
            updateUserAvatar(capturedImage);
            onClose();
        }
    };
    
    const handleRetake = () => {
        setCapturedImage(null);
    };

    const handleUploadPreview = () => {
        if (previewImage) {
            updateUserAvatar(previewImage);
            onClose();
        }
    };
    
    useEffect(() => {
        if (view === 'capture' && !capturedImage) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [view, capturedImage]);
    

    const renderEditView = () => (
        <>
            <div className="flex items-center mb-4 relative">
                <button onClick={onClose} className="p-2 -ml-2 text-text-secondary hover:text-white">
                    <ChevronLeftIcon className="w-6 h-6"/>
                </button>
                <h3 className="text-xl font-bold text-center flex-1 pr-6">Edit Picture</h3>
            </div>
            {error && <div className="text-center my-4 text-red-400 bg-red-500/10 p-3 rounded-lg text-sm">{error}</div>}
            <div className="my-6 flex justify-center">
                 <button onClick={() => setIsZoomed(true)} className="focus:outline-none">
                    <img src={user.avatar} alt="Current avatar" className="w-32 h-32 rounded-full ring-4 ring-slate-600 object-cover" />
                 </button>
            </div>
            <div className="space-y-3 mt-4">
                <button onClick={openFileDialog} className="flex items-center justify-center w-full p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                    <ArrowUpTrayIcon className="w-6 h-6 mr-3" />
                    Replace Picture
                </button>
                <button onClick={() => setView('capture')} className="flex items-center justify-center w-full p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                    <CameraIcon className="w-6 h-6 mr-3" />
                    Capture Image
                </button>
                <button onClick={() => setView('ai')} className="flex items-center justify-center w-full p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                    <SparklesIcon className="w-6 h-6 mr-3" />
                    Create with AI
                </button>
                <button onClick={handleRemovePicture} className="flex items-center justify-center w-full p-3 bg-slate-700 rounded-lg text-red-500">
                    <TrashIcon className="w-6 h-6 mr-3" />
                    Remove Picture
                </button>
            </div>
        </>
    );

    const renderAiView = () => (
        <>
            <div className="flex items-center mb-4 relative">
                <button onClick={() => setView('edit')} className="p-2 -ml-2 text-text-secondary hover:text-white">
                    <ChevronLeftIcon className="w-6 h-6"/>
                </button>
                <h3 className="text-xl font-bold text-center flex-1 pr-6">Create with AI</h3>
            </div>
            <p className="text-sm text-text-secondary mb-4 text-center">Describe the avatar you want to create.</p>
            <div className="space-y-4">
                <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="e.g., a futuristic robot with a friendly smile, pixel art style"
                    className="w-full h-24 p-3 bg-secondary border border-slate-600 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-highlight transition-colors"
                />
                <button onClick={handleGenerateClick} disabled={isLoading} className="w-full flex justify-center items-center p-3 font-semibold rounded-lg bg-accent hover:bg-highlight disabled:bg-slate-500 disabled:cursor-wait">
                    {isLoading && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                    {isLoading ? 'Generating...' : 'Generate'}
                </button>
            </div>
            {error && <div className="text-center my-4 text-red-400">{error}</div>}
            {generatedAvatar && (
                <div className="mt-6 flex flex-col items-center animate-fade-in-fast">
                    <p className="font-semibold mb-3">Generated Avatar:</p>
                    <img src={generatedAvatar} alt="Generated avatar" className="w-32 h-32 rounded-full ring-4 ring-highlight" />
                    <button onClick={handleSetGeneratedAvatar} className="mt-4 w-full p-3 font-semibold rounded-lg bg-green-600 hover:bg-green-500">
                        Set as Profile Picture
                    </button>
                </div>
            )}
        </>
    );

    const renderCaptureView = () => {
        if (capturedImage) {
            return (
                <>
                    <div className="flex items-center mb-4 relative">
                        <h3 className="text-xl font-bold text-center flex-1">Preview</h3>
                    </div>
                    <div className="my-6 flex justify-center">
                        <img src={capturedImage} alt="Captured preview" className="w-32 h-32 rounded-full ring-4 ring-highlight object-cover" />
                    </div>
                    <div className="space-y-3">
                        <button onClick={handleConfirmCapture} className="w-full flex justify-center items-center p-3 font-semibold rounded-lg bg-green-600 hover:bg-green-500">
                            OK
                        </button>
                         <button onClick={handleRetake} className="w-full flex justify-center items-center p-3 font-semibold rounded-lg bg-slate-700 hover:bg-slate-600">
                            Retake
                        </button>
                        <button onClick={() => { setCapturedImage(null); setView('edit'); }} className="w-full flex justify-center items-center p-3 font-semibold rounded-lg bg-secondary hover:bg-slate-600">
                            Cancel
                        </button>
                    </div>
                </>
            );
        }

        return (
            <>
                <div className="flex items-center mb-4 relative">
                    <button onClick={() => setView('edit')} className="p-2 -ml-2 text-text-secondary hover:text-white">
                        <ChevronLeftIcon className="w-6 h-6"/>
                    </button>
                    <h3 className="text-xl font-bold text-center flex-1 pr-6">Capture Image</h3>
                </div>
                <div className="my-4 aspect-square bg-black rounded-lg overflow-hidden flex items-center justify-center">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                </div>
                <button onClick={handleCapture} className="w-full flex justify-center items-center p-3 font-semibold rounded-lg bg-accent hover:bg-highlight">
                    Capture
                </button>
            </>
        );
    };

    const renderPreviewView = () => (
        <>
            <div className="flex items-center mb-4 relative">
                <button onClick={() => setView('edit')} className="p-2 -ml-2 text-text-secondary hover:text-white">
                    <ChevronLeftIcon className="w-6 h-6"/>
                </button>
                <h3 className="text-xl font-bold text-center flex-1 pr-6">Preview Upload</h3>
            </div>
            <div className="my-6 flex justify-center">
                <img src={previewImage!} alt="Uploaded preview" className="w-32 h-32 rounded-full ring-4 ring-highlight object-cover" />
            </div>
            <div className="space-y-3">
                <button onClick={handleUploadPreview} className="w-full flex justify-center items-center p-3 font-semibold rounded-lg bg-green-600 hover:bg-green-500">
                    Use this picture
                </button>
                <button onClick={() => { setPreviewImage(null); setView('edit'); }} className="w-full flex justify-center items-center p-3 font-semibold rounded-lg bg-secondary hover:bg-slate-600">
                    Cancel
                </button>
            </div>
        </>
    );

    const renderContent = () => {
        switch (view) {
            case 'edit': return renderEditView();
            case 'ai': return renderAiView();
            case 'capture': return renderCaptureView();
            case 'preview': return renderPreviewView();
            default: return null;
        }
    };
    
    return (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={handleBackdropClick}>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
            
            {isZoomed && (
                <div className="absolute inset-0 bg-primary z-[60] flex items-center justify-center p-4" onClick={() => setIsZoomed(false)}>
                    <img src={user.avatar} alt="Zoomed avatar" className="max-w-full max-h-full rounded-lg shadow-2xl object-contain" />
                     <button onClick={() => setIsZoomed(false)} className="absolute top-4 right-4 p-1 text-white hover:text-gray-200">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
            )}
            
            <div className="bg-secondary rounded-xl shadow-2xl w-full max-w-sm p-6 relative" onClick={e => e.stopPropagation()}>
                {renderContent()}
            </div>
        </div>
    );
};