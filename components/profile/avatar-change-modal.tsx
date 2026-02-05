"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UploadButton } from "@/lib/upload-thing";
import { updateUserAvatar } from "@/lib/actions/profile-actions";
import { AVATAR_STYLES, type AvatarStyle } from "@/lib/avatar-types";
import { Loader2, Upload, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentImage: string;
  onAvatarChange: (newImageUrl: string) => void;
}

export function AvatarChangeModal({
  isOpen,
  onClose,
  currentImage,
  onAvatarChange,
}: AvatarChangeModalProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "generate">("upload");
  const [selectedStyle, setSelectedStyle] = useState<AvatarStyle>("minimalist");
  const [customPrompt, setCustomPrompt] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch("/api/avatar/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          style: selectedStyle,
          customPrompt: customPrompt.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate avatar");
      }

      setPreviewImage(data.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate avatar");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!previewImage) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      await updateUserAvatar(previewImage);
      onAvatarChange(previewImage);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save avatar");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadComplete = async (url: string) => {
    setPreviewImage(url);
    setError(null);
    
    // Auto-save on upload
    setIsSaving(true);
    try {
      await updateUserAvatar(url);
      onAvatarChange(url);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save avatar");
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setPreviewImage(null);
    setError(null);
    setCustomPrompt("");
    setSelectedStyle("minimalist");
    setActiveTab("upload");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Change Avatar</DialogTitle>
          <DialogDescription>
            Upload a photo or generate a unique avatar using AI
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "upload" | "generate")}>
          <TabsList className="w-full">
            <TabsTrigger value="upload" className="flex-1 gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="generate" className="flex-1 gap-2">
              <Sparkles className="h-4 w-4" />
              Generate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4">
            <div className="flex flex-col items-center gap-4">
              {/* Preview Area */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100">
                  {previewImage || currentImage ? (
                    <img
                      src={previewImage || currentImage}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No image
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Button */}
              <div className="w-full">
                <UploadButton
                  endpoint="imageUploader"
                  onClientUploadComplete={(res) => {
                    if (res && res[0]?.ufsUrl) {
                      handleUploadComplete(res[0].ufsUrl);
                    }
                  }}
                  onUploadError={(error: Error) => {
                    setError(`Upload failed: ${error.message}`);
                  }}
                  appearance={{
                    button: "w-full bg-rose-500 hover:bg-rose-600 text-white",
                    allowedContent: "text-gray-500 text-sm",
                  }}
                />
              </div>

              {isSaving && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="generate" className="mt-4">
            <div className="flex flex-col gap-4">
              {/* Preview Area */}
              <div className="flex justify-center">
                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Generated avatar preview"
                      className="w-full h-full object-cover"
                    />
                  ) : currentImage ? (
                    <img
                      src={currentImage}
                      alt="Current avatar"
                      className="w-full h-full object-cover opacity-50"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm text-center px-2">
                      Generate a preview
                    </div>
                  )}
                </div>
              </div>

              {/* Style Selection */}
              <div className="space-y-2">
                <Label>Choose a style</Label>
                <div className="grid grid-cols-2 gap-2">
                  {AVATAR_STYLES.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setSelectedStyle(style.id)}
                      className={cn(
                        "flex flex-col items-start p-3 rounded-lg border text-left transition-all",
                        selectedStyle === style.id
                          ? "border-rose-500 bg-rose-50 ring-1 ring-rose-500"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium text-sm">{style.name}</span>
                        {selectedStyle === style.id && (
                          <Check className="h-4 w-4 text-rose-500" />
                        )}
                      </div>
                      <span className="text-xs text-gray-500 mt-0.5">
                        {style.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Prompt */}
              <div className="space-y-2">
                <Label htmlFor="customPrompt">
                  Add personal touches (optional)
                </Label>
                <Textarea
                  id="customPrompt"
                  placeholder="e.g., Include a compass, use blue and gold colors, show mountains in the background..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Avatar
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Generation takes about 10-20 seconds
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Footer for Generate Tab */}
        {activeTab === "generate" && previewImage && (
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPreviewImage(null)}
              disabled={isSaving}
            >
              Try Again
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-rose-500 hover:bg-rose-600"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Avatar"
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
