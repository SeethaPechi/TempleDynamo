import React, { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, Upload, X, RotateCcw } from 'lucide-react';

interface CameraCaptureProps {
  onImageCapture: (imageData: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function CameraCapture({ onImageCapture, isOpen, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera by default
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        setStream(mediaStream);
        setIsStreaming(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions or use file upload instead.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsStreaming(false);
    }
  }, [stream]);

  const captureImage = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  }, [stopCamera]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCapturedImage(result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const handleConfirm = useCallback(() => {
    if (capturedImage) {
      onImageCapture(capturedImage);
      setCapturedImage(null);
      onClose();
    }
  }, [capturedImage, onImageCapture, onClose]);

  const handleClose = useCallback(() => {
    stopCamera();
    setCapturedImage(null);
    setError(null);
    onClose();
  }, [stopCamera, onClose]);

  React.useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, capturedImage, startCamera, stopCamera]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera size={20} />
            Capture Temple Image
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {!capturedImage && !error && (
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-64 bg-gray-900 rounded-lg object-cover"
                autoPlay
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {isStreaming && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <Button
                    onClick={captureImage}
                    className="bg-white text-gray-900 hover:bg-gray-100 rounded-full p-3"
                    size="lg"
                  >
                    <Camera size={24} />
                  </Button>
                </div>
              )}
            </div>
          )}

          {capturedImage && (
            <div className="space-y-4">
              <img
                src={capturedImage}
                alt="Captured temple"
                className="w-full h-64 object-cover rounded-lg"
              />
              <div className="flex gap-2 justify-center">
                <Button onClick={handleRetake} variant="outline">
                  <RotateCcw size={16} className="mr-2" />
                  Retake
                </Button>
                <Button onClick={handleConfirm} className="bg-saffron-500 hover:bg-saffron-600">
                  Use This Photo
                </Button>
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <div className="flex items-center justify-center">
              <span className="text-sm text-gray-500 mr-2">Or</span>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Upload size={16} />
                Upload from Device
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}