import React from 'react';
import { User, BackgroundEffect } from '../types';
import { MicrophoneOffIcon, HandRaisedIcon } from './icons';
import { VideoWithBackground } from './VideoWithBackground';

interface MeetingParticipantTileProps {
  participant: User;
  stream?: MediaStream | null;
  isCameraOn: boolean;
  isMicOn: boolean;
  isHandRaised: boolean;
  backgroundEffect: BackgroundEffect;
  wallpaperUrl?: string;
}

const getAvatarUrl = (name: string, url?: string) => {
    if (url) return url;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=393B44&color=FFFFFF&rounded=true`;
}


const MeetingParticipantTileWithoutMemo: React.FC<MeetingParticipantTileProps> = ({ 
    participant, stream, isCameraOn, isMicOn, isHandRaised, backgroundEffect, wallpaperUrl
}) => {
  const { name, avatar } = participant;
  
  const showVideo = stream && isCameraOn;

  return (
    <div className={`relative w-full aspect-video rounded-lg overflow-hidden bg-black border border-slate-700 flex items-center justify-center transition-all duration-300`}>
        {showVideo ? (
             <VideoWithBackground
                stream={stream}
                isCameraOn={isCameraOn}
                backgroundEffect={backgroundEffect}
                wallpaperUrl={wallpaperUrl}
                className="w-full h-full object-cover"
            />
        ) : (
            <div className={`absolute inset-0 flex items-center justify-center bg-primary transition-opacity duration-300`}>
                <img src={getAvatarUrl(name, avatar)} alt={name} className="w-20 h-20 rounded-full object-cover ring-2 ring-slate-600" />
            </div>
        )}
      
      <div className="absolute bottom-2 left-2 flex items-center space-x-2 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm font-semibold z-10">
        {!isMicOn && <MicrophoneOffIcon className="w-4 h-4" />}
        <span>{name}</span>
      </div>

      {isHandRaised && (
        <div className="absolute top-2 right-2 bg-black/50 p-2 rounded-full z-10 animate-ping-once">
            <HandRaisedIcon className="w-5 h-5 text-yellow-400" />
        </div>
      )}
    </div>
  );
};

export const MeetingParticipantTile = React.memo(MeetingParticipantTileWithoutMemo);