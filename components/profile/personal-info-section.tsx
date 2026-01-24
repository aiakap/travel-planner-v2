"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateUserProfile } from "@/lib/actions/profile-actions";
import { User, Pencil, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PersonalInfoSectionProps {
  userName: string;
  userEmail: string;
  userImage: string;
  initialProfile: any;
}

type EditingField = "firstName" | "lastName" | "dateOfBirth" | "address" | "city" | "country" | null;

export function PersonalInfoSection({
  userName,
  userEmail,
  userImage,
  initialProfile,
}: PersonalInfoSectionProps) {
  const [editingField, setEditingField] = useState<EditingField>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    firstName: initialProfile?.firstName || "",
    lastName: initialProfile?.lastName || "",
    dateOfBirth: initialProfile?.dateOfBirth ? new Date(initialProfile.dateOfBirth).toISOString().split('T')[0] : "",
    address: initialProfile?.address || "",
    city: initialProfile?.city || "",
    country: initialProfile?.country || "",
  });

  const [tempValue, setTempValue] = useState("");

  const startEditing = (field: EditingField) => {
    if (field) {
      setTempValue(formData[field]);
      setEditingField(field);
    }
  };

  const cancelEditing = () => {
    setEditingField(null);
    setTempValue("");
  };

  const saveField = async (field: EditingField) => {
    if (!field) return;
    
    setLoading(true);
    try {
      const updateData: any = {};
      
      if (field === "dateOfBirth") {
        updateData[field] = tempValue ? new Date(tempValue) : undefined;
      } else {
        updateData[field] = tempValue;
      }

      await updateUserProfile(updateData);
      setFormData({ ...formData, [field]: tempValue });
      setEditingField(null);
      setTempValue("");
      
      toast({
        title: "Profile updated",
        description: "Your information has been saved",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderField = (
    field: EditingField,
    label: string,
    value: string,
    type: string = "text",
    fullWidth: boolean = false
  ) => {
    const isEditing = editingField === field;
    
    return (
      <div className={`space-y-2 ${fullWidth ? "" : ""}`}>
        <Label className="text-sm text-gray-600">{label}</Label>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              type={type}
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              disabled={loading}
              className="flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") saveField(field);
                if (e.key === "Escape") cancelEditing();
              }}
            />
            <Button
              onClick={() => saveField(field)}
              disabled={loading}
              size="sm"
              className="h-9"
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              onClick={cancelEditing}
              disabled={loading}
              size="sm"
              variant="ghost"
              className="h-9"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div
            onClick={() => startEditing(field)}
            className="group flex items-center justify-between px-3 py-2 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <span className={value ? "text-gray-900" : "text-gray-400"}>
              {value || `Add ${label.toLowerCase()}`}
            </span>
            <Pencil className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Personal Information</h2>

      <div className="flex items-center gap-3 pb-3 border-b">
        {userImage ? (
          <img src={userImage} alt={userName} className="w-12 h-12 rounded-full" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="w-6 h-6 text-gray-500" />
          </div>
        )}
        <div>
          <div className="font-semibold">{userName}</div>
          <div className="text-xs text-gray-500">{userEmail}</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          {renderField("firstName", "First Name", formData.firstName)}
          {renderField("lastName", "Last Name", formData.lastName)}
        </div>

        {renderField("dateOfBirth", "Date of Birth", formData.dateOfBirth, "date", true)}
        {renderField("address", "Address", formData.address, "text", true)}

        <div className="grid grid-cols-2 gap-4">
          {renderField("city", "City", formData.city)}
          {renderField("country", "Country", formData.country)}
        </div>
      </div>
    </div>
  );
}
