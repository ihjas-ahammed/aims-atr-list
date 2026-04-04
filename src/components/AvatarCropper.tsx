import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, Upload, Trash2 } from 'lucide-react';

interface AvatarCropperProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (base64Image: string) => void;
  onRemove: () => void;
  studentName: string;
  hasAvatar: boolean;
}

export function AvatarCropper({ isOpen, onClose, onSave, onRemove, studentName, hasAvatar }: AvatarCropperProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Reset state when opened
  React.useEffect(() => {
    if (isOpen) {
      setImageSrc(null);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    }
  }, [isOpen]);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result?.toString() || null);
      });
      reader.readAsDataURL(file);
    }
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any
  ): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    canvas.width = 256;
    canvas.height = 256;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      256,
      256
    );

    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const handleSave = async () => {
    if (imageSrc && croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
        onSave(croppedImage);
        onClose();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleRemove = () => {
    onRemove();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 truncate">Avatar for {studentName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 flex flex-col items-center justify-center min-h-[400px]">
          {!imageSrc ? (
            <label className="cursor-pointer flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-600">Click to upload image</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          ) : (
            <div className="relative w-full h-64 bg-black rounded-xl overflow-hidden">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
          )}
          
          {imageSrc && (
            <div className="w-full mt-6 space-y-2">
              <label className="text-sm font-medium text-gray-700">Zoom</label>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-between gap-3 bg-gray-50">
          <div className="flex gap-2">
            {imageSrc ? (
              <button
                onClick={() => setImageSrc(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition-colors text-sm"
              >
                Change Image
              </button>
            ) : hasAvatar ? (
              <button
                onClick={handleRemove}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Remove Avatar
              </button>
            ) : (
              <div></div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!imageSrc}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors font-medium text-sm"
            >
              <Check className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
