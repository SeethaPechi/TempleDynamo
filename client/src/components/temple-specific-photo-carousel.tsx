import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Eye,
  MapPin,
  Camera,
  TreePine,
} from "lucide-react";
import type { Temple } from "@shared/schema";

interface TempleSpecificPhotoCarouselProps {
  temple: Temple;
  className?: string;
}

export function TempleSpecificPhotoCarousel({ temple, className = "" }: TempleSpecificPhotoCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Get only this temple's photos
  const templePhotos = [];
  
  // Add main temple image if exists
  if (temple.templeImage) {
    templePhotos.push({
      image: temple.templeImage,
      temple: temple,
      isMain: true,
    });
  }
  
  // Add additional temple photos if exists
  if (temple.templePhotos && Array.isArray(temple.templePhotos) && temple.templePhotos.length > 0) {
    temple.templePhotos.forEach((photo) => {
      templePhotos.push({
        image: photo,
        temple: temple,
        isMain: false,
      });
    });
  }

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || templePhotos.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % templePhotos.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, templePhotos.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % templePhotos.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + templePhotos.length) % templePhotos.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  if (templePhotos.length === 0) {
    return (
      <Card className={`p-8 text-center bg-gradient-to-r from-saffron-50 to-gold-50 ${className}`}>
        <TreePine className="mx-auto mb-4 text-saffron-400" size={48} />
        <h3 className="text-lg font-semibold text-temple-brown mb-2">{temple.templeName} Photos</h3>
        <p className="text-gray-600">No photos available for this temple</p>
        <p className="text-sm text-gray-500 mt-1">Upload temple photos to see them here</p>
      </Card>
    );
  }

  const currentPhoto = templePhotos[currentSlide];

  return (
    <Card className={`overflow-hidden bg-gradient-to-r from-saffron-50 to-gold-50 ${className}`}>
      <div className="relative">
        {/* Main Image Display */}
        <div className="relative h-96 overflow-hidden">
          <img
            src={currentPhoto.image}
            alt={`${currentPhoto.temple.templeName}`}
            className="w-full h-full object-cover transition-all duration-500"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          
          {/* Navigation Arrows */}
          {templePhotos.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="sm"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white/90"
                onClick={prevSlide}
              >
                <ChevronLeft size={16} />
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white/90"
                onClick={nextSlide}
              >
                <ChevronRight size={16} />
              </Button>
            </>
          )}

          {/* Auto-play Control */}
          {templePhotos.length > 1 && (
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4 bg-white/80 hover:bg-white/90"
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            >
              {isAutoPlaying ? <Pause size={16} /> : <Play size={16} />}
            </Button>
          )}

          {/* View Full Size */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-4 left-4 bg-white/80 hover:bg-white/90"
                onClick={() => setSelectedImage(currentPhoto.image)}
              >
                <Eye size={16} />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>{currentPhoto.temple.templeName}</DialogTitle>
              </DialogHeader>
              <div className="flex justify-center">
                <img
                  src={currentPhoto.image}
                  alt={currentPhoto.temple.templeName}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              </div>
            </DialogContent>
          </Dialog>

          {/* Temple Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">{currentPhoto.temple.templeName}</h3>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center">
                    <MapPin size={14} className="mr-1" />
                    {currentPhoto.temple.village}, {currentPhoto.temple.nearestCity}
                  </div>
                  {currentPhoto.temple.deity && (
                    <div className="flex items-center">
                      <TreePine size={14} className="mr-1" />
                      {currentPhoto.temple.deity}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-2">
                {currentPhoto.isMain && (
                  <Badge variant="secondary" className="bg-saffron-500 text-white">
                    Main Photo
                  </Badge>
                )}
                <Badge variant="secondary" className="bg-white/20 text-white">
                  <Camera size={10} className="mr-1" />
                  {currentSlide + 1}/{templePhotos.length}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Thumbnail Navigation */}
        {templePhotos.length > 1 && (
          <div className="p-4 bg-white">
            <div className="flex space-x-2 overflow-x-auto">
              {templePhotos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    currentSlide === index
                      ? "border-saffron-500 ring-2 ring-saffron-200"
                      : "border-gray-200 hover:border-saffron-300"
                  }`}
                >
                  <img
                    src={photo.image}
                    alt={`${photo.temple.templeName} thumbnail`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Progress Indicators */}
        {templePhotos.length > 1 && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {templePhotos.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentSlide === index ? "bg-white" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}