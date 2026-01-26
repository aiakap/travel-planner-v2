"use client";

import { useState } from "react";
import { Upload, X, FileText, Image as ImageIcon, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface UploadZoneProps {
  onFilesAdded: (files: File[]) => void;
}

export function UploadZone({ onFilesAdded }: UploadZoneProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    
    // Filter supported formats
    const supported = droppedFiles.filter((f) =>
      f.name.match(/\.(eml|txt|png|jpg|jpeg|pdf)$/i)
    );

    if (supported.length > 0) {
      setFiles((prev) => [...prev, ...supported]);
    }

    if (supported.length < droppedFiles.length) {
      alert(
        `${droppedFiles.length - supported.length} file(s) skipped. Only .eml, .txt, .png, .jpg, and .pdf files are supported.`
      );
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (files.length > 0) {
      onFilesAdded(files);
      setFiles([]);
    }
  };

  const getFileIcon = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "eml" || ext === "txt") {
      return <FileText className="w-8 h-8 text-blue-500" />;
    } else if (["png", "jpg", "jpeg"].includes(ext || "")) {
      return <ImageIcon className="w-8 h-8 text-green-500" />;
    } else {
      return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center transition-all
          ${
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
              : "border-gray-300 hover:border-gray-400 dark:border-gray-700"
          }
        `}
      >
        <Upload
          className={`w-16 h-16 mx-auto mb-4 transition-colors ${
            isDragging ? "text-blue-500" : "text-gray-400"
          }`}
        />
        <h3 className="text-lg font-semibold mb-2">
          Drag & drop files here
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          or click to browse
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          Supports: .eml, .txt, .png, .jpg, .pdf
        </p>
        <input
          type="file"
          multiple
          accept=".eml,.txt,.png,.jpg,.jpeg,.pdf"
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload">
          <Button type="button" variant="outline" className="mt-4" asChild>
            <span>Choose Files</span>
          </Button>
        </label>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">
              {files.length} file{files.length > 1 ? "s" : ""} ready to upload
            </h4>
            <Button onClick={handleUpload} size="sm">
              Add to Queue
            </Button>
          </div>

          <div className="space-y-2">
            {files.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
              >
                <div className="flex-shrink-0">{getFileIcon(file)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(i)}
                  className="flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
