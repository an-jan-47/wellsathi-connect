import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UseFileUploadOptions {
  bucket: 'clinic-images' | 'clinic-certificates';
  maxSizeMB?: number;
  allowedTypes?: string[];
  folder?: string;
}

interface UploadResult {
  url: string;
  path: string;
}

export function useFileUpload(options: UseFileUploadOptions) {
  const { 
    bucket, 
    maxSizeMB = 5, 
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    folder 
  } = options;
  
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const validateFile = useCallback((file: File): string | null => {
    const maxBytes = maxSizeMB * 1024 * 1024;
    
    if (file.size > maxBytes) {
      return `File size must be less than ${maxSizeMB}MB`;
    }
    
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`;
    }
    
    return null;
  }, [maxSizeMB, allowedTypes]);

  const uploadFile = useCallback(async (file: File, userId: string): Promise<UploadResult | null> => {
    const validationError = validateFile(file);
    if (validationError) {
      toast({
        title: 'Upload Error',
        description: validationError,
        variant: 'destructive',
      });
      return null;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'file';
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 10);
      const fileName = `${timestamp}-${randomId}.${fileExt}`;
      const filePath = folder 
        ? `${userId}/${folder}/${fileName}` 
        : `${userId}/${fileName}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      setProgress(100);

      // Get public URL for public buckets, or signed URL for private
      if (bucket === 'clinic-images') {
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);
        
        return {
          url: urlData.publicUrl,
          path: filePath,
        };
      } else {
        // For private buckets, store the path
        return {
          url: filePath,
          path: filePath,
        };
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload file',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, [bucket, folder, validateFile]);

  const uploadMultiple = useCallback(async (files: File[], userId: string): Promise<UploadResult[]> => {
    const results: UploadResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      setProgress(Math.round((i / files.length) * 100));
      const result = await uploadFile(files[i], userId);
      if (result) {
        results.push(result);
      }
    }
    
    return results;
  }, [uploadFile]);

  const deleteFile = useCallback(async (path: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  }, [bucket]);

  return {
    uploadFile,
    uploadMultiple,
    deleteFile,
    isUploading,
    progress,
  };
}
