import React, { useRef, useEffect, memo } from 'react';
import { BackgroundEffect } from '../types';

interface VideoWithBackgroundProps {
    stream: MediaStream | null;
    isCameraOn: boolean;
    backgroundEffect: BackgroundEffect;
    wallpaperUrl?: string;
    className?: string;
}

const VideoWithBackgroundComponent: React.FC<VideoWithBackgroundProps> = ({ stream, isCameraOn, backgroundEffect, wallpaperUrl, className }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(document.createElement('video'));
    const segmentationRef = useRef<any>(null);
    const wallpaperRef = useRef<HTMLImageElement>(new Image());

    // Use refs to store the latest prop values for the animation loop to avoid stale closures
    const propsRef = useRef({ isCameraOn, backgroundEffect, wallpaperUrl, stream });
    propsRef.current = { isCameraOn, backgroundEffect, wallpaperUrl, stream };

    // Effect for handling the stream source
    useEffect(() => {
        const videoElement = videoRef.current;
        videoElement.autoplay = true;
        videoElement.muted = true;
        
        const handleResize = () => {
            const canvas = canvasRef.current;
            if (canvas && videoElement.videoWidth > 0) {
                canvas.width = videoElement.videoWidth;
                canvas.height = videoElement.videoHeight;
            }
        };

        if (stream) {
            videoElement.srcObject = stream;
            videoElement.addEventListener('loadedmetadata', handleResize);
            videoElement.play().catch(e => {
                // Ignore AbortError which is common on fast re-renders/component unmount
                 if (e.name !== 'AbortError') console.error("Video play error:", e);
            });
        } else {
             videoElement.srcObject = null;
        }

        return () => {
            videoElement.removeEventListener('loadedmetadata', handleResize);
        }
    }, [stream]);
    
    // Effect for handling wallpaper changes
    useEffect(() => {
        if (backgroundEffect === 'wallpaper' && wallpaperUrl) {
            wallpaperRef.current.crossOrigin = 'Anonymous';
            wallpaperRef.current.src = wallpaperUrl;
        }
    }, [backgroundEffect, wallpaperUrl]);
    
    // Effect for setting up and tearing down the animation loop and MediaPipe instance
    useEffect(() => {
        if ((window as any).SelfieSegmentation) {
            segmentationRef.current = new (window as any).SelfieSegmentation({
                locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1675465747/${file}`
            });
            segmentationRef.current.setOptions({ modelSelection: 0 });
        } else {
            console.error("SelfieSegmentation library not loaded.");
            return;
        }

        const canvasElement = canvasRef.current;
        if (!canvasElement) return;

        const canvasCtx = canvasElement.getContext('2d');
        if (!canvasCtx) return;

        const videoElement = videoRef.current;
        let animationFrameId: number;

        const onResults = (results: any) => {
            if (!canvasElement || !results.image || !canvasCtx) return;
            const { backgroundEffect } = propsRef.current;
            const wallpaperImage = wallpaperRef.current;
            
            canvasCtx.save();
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

            if (backgroundEffect === 'none' || !results.segmentationMask) {
                canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
            } else {
                canvasCtx.drawImage(results.segmentationMask, 0, 0, canvasElement.width, canvasElement.height);
                canvasCtx.globalCompositeOperation = 'source-in';
                canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
                canvasCtx.globalCompositeOperation = 'destination-over';

                if (backgroundEffect === 'blur') {
                    canvasCtx.filter = 'blur(8px)';
                    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
                } else if (backgroundEffect === 'wallpaper' && wallpaperImage.complete && wallpaperImage.naturalWidth > 0) {
                    canvasCtx.drawImage(wallpaperImage, 0, 0, canvasElement.width, canvasElement.height);
                } else {
                    canvasCtx.fillStyle = '#1F2029'; // Fallback background
                    canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
                }
            }
            canvasCtx.restore();
        };

        if(segmentationRef.current) {
            segmentationRef.current.onResults(onResults);
        }

        const renderLoop = async () => {
            const { isCameraOn } = propsRef.current;
            if (isCameraOn && videoElement.readyState >= 2 && videoElement.videoWidth > 0 && segmentationRef.current) {
                try {
                    await segmentationRef.current.send({ image: videoElement });
                } catch (err) {
                    // This can happen if the video is not ready, we just ignore and try next frame.
                }
            } else {
                 if (canvasElement.width === 0 || canvasElement.height === 0) {
                    canvasElement.width = 1280;
                    canvasElement.height = 720;
                }
                if (canvasCtx) {
                    canvasCtx.fillStyle = '#1F2029';
                    canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
                    canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                    canvasCtx.font = '20px sans-serif';
                    canvasCtx.textAlign = 'center';
                    canvasCtx.fillText("Camera is off", canvasElement.width / 2, canvasElement.height / 2);
                }
            }
            animationFrameId = requestAnimationFrame(renderLoop);
        };

        renderLoop();

        return () => {
            cancelAnimationFrame(animationFrameId);
            segmentationRef.current?.close();
        };
    }, []); // This effect runs only once to set up the render loop and MediaPipe instance.

    return <canvas ref={canvasRef} className={className} />;
};

export const VideoWithBackground = memo(VideoWithBackgroundComponent);