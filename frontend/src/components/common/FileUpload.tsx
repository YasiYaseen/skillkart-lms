import { useState, useRef } from 'react';
import { api } from '@/lib/api';

interface FileUploadProps {
  onUploadSuccess: (url: string) => void;
  accept?: string;
  label?: string;
  maxSizeMB?: number;
  folder?: string;
}

export default function FileUpload({ 
  onUploadSuccess, 
  accept = 'image/*', 
  label = 'Upload a file',
  maxSizeMB = 15,
  folder
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${maxSizeMB}MB.`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setError(null);
    setIsUploading(true);

    const formData = new FormData();
    if (folder) {
      formData.append('folder', folder);
    }
    formData.append('file', file);

    try {
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const fileUrl = response.data.url;
      onUploadSuccess(fileUrl);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to upload file';
      setError(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/60 disabled:opacity-50 transition-colors cursor-pointer"
        >
          {isUploading ? 'Uploading...' : 'Choose File'}
        </button>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Max {maxSizeMB}MB
        </span>
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />
      
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
