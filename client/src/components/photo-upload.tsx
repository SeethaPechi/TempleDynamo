import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Camera,
  Upload,
  X,
  Plus,
  Image as ImageIcon,
  Trash2,
  Eye,
  User,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
  allowProfilePicture?: boolean;
  profilePicture?: string;
  onProfilePictureChange?: (profilePicture: string) => void;
  title?: string;
  description?: string;
}

export function PhotoUpload({
  photos = [],
  onPhotosChange,
  maxPhotos = 10,
  allowProfilePicture = false,
  profilePicture,
  onProfilePictureChange,
  title = "Photo Upload",
  description = "Upload and manage photos",
}: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const compressImage = (file: File, maxWidth = 800, quality = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        // Draw and compress
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (files: FileList | null, isProfile = false) => {
    if (!files || files.length === 0) return;

    console.log(`Starting file upload - isProfile: ${isProfile}, files: ${files.length}`);

    if (isProfile && files.length > 1) {
      toast({
        title: "Error",
        description: "Please select only one profile picture",
        variant: "destructive",
      });
      return;
    }

    if (!isProfile && photos.length + files.length > maxPhotos) {
      toast({
        title: "Error",
        description: `Maximum ${maxPhotos} photos allowed`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const newPhotos: string[] = [];
      const totalFiles = files.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file type
        if (!file.type.startsWith("image/")) {
          toast({
            title: "Error",
            description: "Please select only image files",
            variant: "destructive",
          });
          continue;
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "Error",
            description: `File ${file.name} is too large. Maximum size is 5MB`,
            variant: "destructive",
          });
          continue;
        }

        // Compress image
        console.log(`Processing file: ${file.name}, size: ${file.size} bytes`);
        const compressedImage = await compressImage(file);
        console.log(`Compressed image size: ${compressedImage.length} characters`);
        
        if (isProfile) {
          console.log("Setting profile picture");
          onProfilePictureChange?.(compressedImage);
          toast({
            title: "Success",
            description: "Profile picture updated successfully",
          });
        } else {
          newPhotos.push(compressedImage);
        }

        setUploadProgress(((i + 1) / totalFiles) * 100);
      }

      if (!isProfile && newPhotos.length > 0) {
        const updatedPhotos = [...photos, ...newPhotos];
        console.log("Photo upload complete. Calling onPhotosChange with:", updatedPhotos.length, "photos");
        onPhotosChange(updatedPhotos);
        toast({
          title: "Success",
          description: `${newPhotos.length} photo(s) uploaded successfully`,
        });
      }
    } catch (error) {
      console.error("Photo upload error:", error);
      toast({
        title: "Error",
        description: `Failed to upload photos: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const removePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(updatedPhotos);
    toast({
      title: "Success",
      description: "Photo removed successfully",
    });
  };

  const removeProfilePicture = () => {
    onProfilePictureChange?.("");
    toast({
      title: "Success",
      description: "Profile picture removed successfully",
    });
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold text-temple-brown mb-2">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>

        {/* Profile Picture Section */}
        {allowProfilePicture && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-temple-brown">Profile Picture</h4>
              <Badge variant="outline" className="text-xs">
                <User className="mr-1" size={10} />
                Main Photo
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Profile Picture Display */}
              <div className="w-24 h-24 rounded-full border-2 border-saffron-200 overflow-hidden bg-gray-100 flex items-center justify-center">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="text-gray-400" size={32} />
                )}
              </div>

              {/* Profile Picture Controls */}
              <div className="flex-1 space-y-2">
                <Input
                  ref={profileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e.target.files, true)}
                  className="hidden"
                />
                
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => profileInputRef.current?.click()}
                    className="bg-saffron-500 hover:bg-saffron-600"
                    disabled={isUploading}
                  >
                    <Camera className="mr-2" size={14} />
                    {profilePicture ? "Change" : "Upload"}
                  </Button>
                  
                  {profilePicture && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={removeProfilePicture}
                      disabled={isUploading}
                    >
                      <X className="mr-2" size={14} />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Photo Gallery Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-temple-brown">Photo Gallery</h4>
            <Badge variant="outline" className="text-xs">
              {photos.length}/{maxPhotos} photos
            </Badge>
          </div>

          {/* Upload Button */}
          <div className="border-2 border-dashed border-saffron-200 rounded-lg p-6 text-center">
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
            
            <div className="space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-saffron-100 flex items-center justify-center">
                <Upload className="text-saffron-600" size={24} />
              </div>
              
              <div>
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || photos.length >= maxPhotos}
                  className="bg-saffron-500 hover:bg-saffron-600"
                >
                  <Plus className="mr-2" size={16} />
                  Add Photos
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Max {maxPhotos} photos, 5MB each. JPG, PNG supported.
                </p>
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Photo Grid */}
          {photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Photo Controls Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => setPreviewImage(photo)}
                        >
                          <Eye size={14} />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Photo Preview</DialogTitle>
                        </DialogHeader>
                        <div className="flex justify-center">
                          <img
                            src={photo}
                            alt="Preview"
                            className="max-w-full max-h-96 object-contain"
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => removePhoto(index)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                  
                  {/* Photo Index */}
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="text-xs">
                      {index + 1}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {photos.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <ImageIcon size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No photos uploaded yet</p>
              <p className="text-sm">Click "Add Photos" to get started</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}