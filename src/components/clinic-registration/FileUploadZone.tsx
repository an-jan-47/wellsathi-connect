import { useCallback, useState } from 'react';
import { Upload, X, FileImage, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  onRemove: (index: number) => void;
  uploadedUrls: string[];
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  isUploading?: boolean;
  label?: string;
  description?: string;
  showPreviews?: boolean;
}

export function FileUploadZone({
  onFilesSelected,
  onRemove,
  uploadedUrls,
  accept = 'image/*',
  multiple = true,
  maxFiles = 5,
  isUploading = false,
  label = 'Upload Files',
  description = 'Drag and drop files here or click to browse',
  showPreviews = true,
}: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const remainingSlots = maxFiles - uploadedUrls.length;
    
    if (remainingSlots > 0) {
      onFilesSelected(files.slice(0, remainingSlots));
    }
  }, [maxFiles, uploadedUrls.length, onFilesSelected]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const remainingSlots = maxFiles - uploadedUrls.length;
    
    if (remainingSlots > 0) {
      onFilesSelected(files.slice(0, remainingSlots));
    }
    
    // Reset input
    e.target.value = '';
  }, [maxFiles, uploadedUrls.length, onFilesSelected]);

  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.includes('clinic-images');
  };

  const canUploadMore = uploadedUrls.length < maxFiles;

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-foreground">{label}</label>
      
      {canUploadMore && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 cursor-pointer',
            'hover:border-primary/50 hover:bg-accent/30',
            isDragOver && 'border-primary bg-accent/50',
            isUploading && 'pointer-events-none opacity-60'
          )}
        >
          <input
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          
          <div className="flex flex-col items-center gap-3 text-center">
            {isUploading ? (
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            ) : (
              <Upload className="h-10 w-10 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium text-foreground">
                {isUploading ? 'Uploading...' : description}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {uploadedUrls.length}/{maxFiles} files uploaded
              </p>
            </div>
          </div>
        </div>
      )}

      {showPreviews && uploadedUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {uploadedUrls.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="relative group rounded-lg overflow-hidden border border-border bg-card"
            >
              {isImage(url) ? (
                <img
                  src={url}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-24 object-cover"
                />
              ) : (
                <div className="w-full h-24 flex items-center justify-center bg-muted">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRemove(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
