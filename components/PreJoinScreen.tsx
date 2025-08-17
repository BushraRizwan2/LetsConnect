import React, { useState, useEffect, useRef } from 'react';
import { BackgroundEffect, PreJoinSettings } from '../types';
import { useAppContext } from '../context/AppContext';
import { MicrophoneOnIcon, MicrophoneOffIcon, VideoCameraIcon, VideoCameraSlashIcon, SparklesIcon, XIcon } from './icons';
import { virtualBackgrounds } from '../data/virtualBackgrounds';
import { VideoWithBackground } from './VideoWithBackground';

interface PreJoinScreenProps {
    onClose: () => void;
    onJoin: (settings: PreJoinSettings) => void;
    meetingTitle: string;
    initialAudioOn?: boolean;
    initialVideoOn?: boolean;
}

export const PreJoinScreen: React.FC<PreJoinScreenProps> = ({ onClose, onJoin, meetingTitle, initialAudioOn = true, initialVideoOn = true }) => {
    const { user } = useAppContext();
    const [isMicOn, setIsMicOn] = useState(initialAudioOn);
    const [isCameraOn, setIsCameraOn] = useState(initialVideoOn);
    const [backgroundEffect, setBackgroundEffect] = useState<BackgroundEffect>('none');
    const [selectedWallpaper, setSelectedWallpaper] = useState<string | undefined>(undefined);
    const [showEffectsMenu, setShowEffectsMenu] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const effectsMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Preload the user's avatar to ensure the blurred background appears quickly.
        const avatarPreloader = new Image();
        avatarPreloader.src = user.avatar;
    }, [user.avatar]);

    useEffect(() => {
        let currentStream: MediaStream | null = null;
        const setupStream = async () => {
            setIsLoading(true);
            try {
                const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const audioTracks = audioStream.getAudioTracks();
                audioTracks.forEach(track => (track.enabled = initialAudioOn));
                
                let videoTracks: MediaStreamTrack[] = [];
                if (initialVideoOn) {
                    const videoStream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
                    videoTracks = videoStream.getVideoTracks();
                }
                
                const combinedStream = new MediaStream([...audioTracks, ...videoTracks]);
                currentStream = combinedStream;
                setStream(combinedStream);

            } catch (error) {
                console.error('Error accessing media devices.', error);
                alert('Could not access your camera or microphone. Please check browser permissions.');
                setIsCameraOn(false);
                setIsMicOn(false);
            } finally {
                setIsLoading(false);
            }
        };

        setupStream();

        return () => {
            currentStream?.getTracks().forEach(track => track.stop());
        };
    }, []); // This effect should run only once on mount

    const handleToggleMic = () => {
        setIsMicOn(prev => {
            const newState = !prev;
            stream?.getAudioTracks().forEach(track => {
                track.enabled = newState;
            });
            return newState;
        });
    };

    const handleToggleCamera = async () => {
        if (isCameraOn) {
            // Turning OFF
            setIsCameraOn(false);
            setShowEffectsMenu(false); // Close effects menu when camera is turned off
            setBackgroundEffect('none');
            setSelectedWallpaper(undefined);
            stream?.getVideoTracks().forEach(track => {
                track.stop();
            });
            // Create a new stream with only audio to reflect the change
            const newStream = new MediaStream(stream?.getAudioTracks() || []);
            setStream(newStream);
        } else {
            // Turning ON
            setIsLoading(true);
            try {
                const videoStream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
                const newVideoTracks = videoStream.getVideoTracks();

                const audioTracks = stream?.getAudioTracks() || [];
                const newStream = new MediaStream([...audioTracks, ...newVideoTracks]);
                
                setStream(newStream);
                setIsCameraOn(true);

            } catch (error) {
                console.error('Error accessing camera.', error);
                alert('Could not access camera. Please check browser permissions.');
                setIsCameraOn(false);
            } finally {
                setIsLoading(false);
            }
        }
    };
    

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (effectsMenuRef.current && !effectsMenuRef.current.contains(event.target as Node)) {
                setShowEffectsMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleJoinClick = () => {
        // Stop the tracks before passing control to the meeting screen
        stream?.getTracks().forEach(track => track.stop());
        onJoin({
            isMicOn,
            isCameraOn,
            backgroundEffect,
            wallpaperUrl: selectedWallpaper,
        });
    };

    const handleBackgroundEffectChange = (effect: BackgroundEffect, url?: string) => {
        setBackgroundEffect(effect);
        setSelectedWallpaper(url);
        setShowEffectsMenu(false);
    };

    const ControlButton: React.FC<{
        isActive: boolean;
        onToggle: () => void;
        activeIcon: React.ReactNode;
        inactiveIcon: React.ReactNode;
        label: string;
    }> = ({ isActive, onToggle, activeIcon, inactiveIcon, label }) => (
        <button
            onClick={onToggle}
            className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-colors ${isActive ? 'bg-slate-600' : 'bg-red-500 text-white'}`}
            aria-label={label}
        >
            {isActive ? activeIcon : inactiveIcon}
        </button>
    );

    const EffectsMenu = () => (
        <div ref={effectsMenuRef} className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-80 bg-primary p-3 rounded-xl shadow-2xl border border-slate-600 z-20">
            <h4 className="font-bold text-center mb-3">Background Effects</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
                <button onClick={() => handleBackgroundEffectChange('none')} className={`aspect-square flex flex-col items-center justify-center rounded-lg hover:bg-secondary ${backgroundEffect === 'none' ? 'ring-2 ring-highlight' : ''}`}>
                    <XIcon className="w-8 h-8"/>
                    <span className="text-xs mt-1">None</span>
                </button>
                <button onClick={() => handleBackgroundEffectChange('blur')} className={`aspect-square flex flex-col items-center justify-center rounded-lg hover:bg-secondary ${backgroundEffect === 'blur' ? 'ring-2 ring-highlight' : ''}`}>
                    <span className="text-2xl font-bold backdrop-blur-sm">A</span>
                    <span className="text-xs mt-1">Blur</span>
                </button>
            </div>
            <div className="h-px bg-slate-700 my-3"></div>
            <h5 className="font-semibold text-sm mb-2">Virtual Backgrounds</h5>
            <div className="grid grid-cols-3 gap-2">
                {virtualBackgrounds.map(bg => (
                     <button key={bg.id} onClick={() => handleBackgroundEffectChange('wallpaper', bg.url)} className={`aspect-square rounded-lg overflow-hidden hover:opacity-80 ${selectedWallpaper === bg.url ? 'ring-2 ring-highlight' : ''}`}>
                        <img src={bg.url} alt={bg.name} className="w-full h-full object-cover"/>
                    </button>
                ))}
            </div>
        </div>
    );
    
    const VideoDisplay = () => {
        if (isLoading) {
            return (
                <div className="w-full h-full flex flex-col items-center justify-center bg-black/50">
                     <svg className="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            );
        }

        if (!isCameraOn) {
            return (
                <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden p-4 text-center">
                    <img 
                        src={user.avatar} 
                        alt="" 
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover filter blur-2xl scale-110 brightness-50"
                    />
                    <div className="relative z-10 flex flex-col items-center justify-center">
                        <div className="relative w-56 h-56 flex items-center justify-center">
                            <div className="absolute inset-0 bg-white/5 rounded-full animate-pulse-slow"></div>
                            <img 
                                src={user.avatar} 
                                alt={user.name} 
                                className="w-48 h-48 rounded-full object-cover shadow-lg z-10 ring-4 ring-white/10" 
                            />
                        </div>
                        
                        <h2 className="mt-6 text-2xl font-bold text-white drop-shadow-md">
                            Your camera is off
                        </h2>
                        
                        <p className="mt-2 text-white/80 max-w-sm drop-shadow-sm">
                            {isMicOn 
                                ? "Your mic is on, so you'll be heard but not seen." 
                                : "Your mic is also off, so you won't be seen or heard."}
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="w-full h-full bg-black relative">
                <VideoWithBackground
                    stream={stream}
                    isCameraOn={isCameraOn}
                    backgroundEffect={backgroundEffect}
                    wallpaperUrl={selectedWallpaper}
                    className="w-full h-full object-cover"
                />
                {!isMicOn && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full flex items-center space-x-2 text-sm font-semibold backdrop-blur-sm animate-fade-in-fast">
                        <MicrophoneOffIcon className="w-5 h-5" />
                        <span>Your microphone is off</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="absolute inset-0 bg-primary z-50 flex flex-col items-center justify-between p-4 md:p-8 animate-fade-in-fast">
             <div className="absolute top-4 right-4">
                <button onClick={onClose} className="bg-secondary rounded-full p-2 hover:bg-slate-700">
                    <XIcon className="w-6 h-6 text-white"/>
                </button>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-center mt-8 truncate max-w-full" title={meetingTitle}>
                {meetingTitle}
            </h1>

            <div 
                className="relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl my-4"
            >
                <VideoDisplay />
            </div>
            
            <div className="flex flex-col items-center w-full">
                <div className="relative flex items-center justify-center space-x-4">
                    <ControlButton 
                        isActive={isMicOn}
                        onToggle={handleToggleMic}
                        activeIcon={<MicrophoneOnIcon className="w-8 h-8" />}
                        inactiveIcon={<MicrophoneOffIcon className="w-8 h-8" />}
                        label={isMicOn ? "Mute microphone" : "Unmute microphone"}
                    />
                     <button
                        onClick={handleToggleCamera}
                        className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-colors ${isCameraOn ? 'bg-slate-600' : 'bg-red-500 text-white'}`}
                        aria-label={isCameraOn ? "Turn off camera" : "Turn on camera"}
                    >
                        {isCameraOn ? <VideoCameraIcon className="w-8 h-8" /> : <VideoCameraSlashIcon className="w-8 h-8" />}
                    </button>
                    <button
                        onClick={() => setShowEffectsMenu(p => !p)}
                        className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-colors ${showEffectsMenu ? 'bg-highlight' : 'bg-slate-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
                        aria-label="Background effects"
                        disabled={!isCameraOn}
                    >
                        <SparklesIcon className="w-8 h-8" />
                    </button>
                    {showEffectsMenu && <EffectsMenu />}
                </div>

                <button
                    onClick={handleJoinClick}
                    className="mt-8 w-full max-w-xs px-8 py-4 bg-accent text-white text-lg font-bold rounded-lg hover:bg-highlight transition-colors"
                >
                    Join Now
                </button>
            </div>
        </div>
    );
};
