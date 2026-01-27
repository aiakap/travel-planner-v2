"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addContact, updateContact, deleteContact } from "@/lib/actions/profile-actions";
import { Trash2, Star, Plus } from "lucide-react";
import { useAutoSave } from "@/hooks/use-auto-save";
import { SaveStatusIndicator } from "@/components/ui/save-status-indicator";

interface ContactsSectionProps {
  initialContacts: any[];
  contactTypes: any[];
}

export function ContactsSection({ initialContacts, contactTypes }: ContactsSectionProps) {
  const [contacts, setContacts] = useState(initialContacts);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [showNewRow, setShowNewRow] = useState(false);
  const [newContact, setNewContact] = useState({
    contactTypeId: "",
    value: "",
    label: "",
    isPrimary: false,
  });

  const inlineInputClass = "px-2 py-1 text-sm border-none bg-transparent hover:bg-gray-50 focus:bg-white focus:border focus:border-gray-300 focus:shadow-sm rounded transition-all";

  const handleAddContact = async () => {
    if (!newContact.contactTypeId || !newContact.value) return;

    setSaveStatus("saving");
    try {
      const added = await addContact(newContact);
      setContacts([...contacts, { ...added, contactType: contactTypes.find(ct => ct.id === newContact.contactTypeId) }]);
      setNewContact({ contactTypeId: "", value: "", label: "", isPrimary: false });
      setShowNewRow(false);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Error adding contact:", error);
      setSaveStatus("error");
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      await deleteContact(contactId);
      setContacts(contacts.filter(c => c.id !== contactId));
    } catch (error) {
      console.error("Error deleting contact:", error);
    }
  };

  const handleTogglePrimary = async (contactId: string, currentPrimary: boolean) => {
    try {
      await updateContact(contactId, { isPrimary: !currentPrimary });
      setContacts(contacts.map(c => 
        c.id === contactId ? { ...c, isPrimary: !currentPrimary } : c
      ));
    } catch (error) {
      console.error("Error updating contact:", error);
    }
  };

  const handleUpdateContactValue = async (contactId: string, value: string) => {
    setSaveStatus("saving");
    try {
      await updateContact(contactId, { value });
      setContacts(contacts.map(c => c.id === contactId ? { ...c, value } : c));
      setEditingContactId(null);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Error updating contact:", error);
      setSaveStatus("error");
    }
  };

  const handleUpdateContactLabel = async (contactId: string, label: string) => {
    setSaveStatus("saving");
    try {
      await updateContact(contactId, { label });
      setContacts(contacts.map(c => c.id === contactId ? { ...c, label } : c));
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Error updating contact:", error);
      setSaveStatus("error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Contact Information</h2>
        <SaveStatusIndicator status={saveStatus} />
      </div>

      <div className="space-y-2">
        {contacts.length === 0 && !showNewRow ? (
          <p className="text-gray-500 text-center py-4 text-sm">
            No contacts added yet. 
            <button 
              onClick={() => setShowNewRow(true)}
              className="text-blue-600 hover:underline ml-1"
            >
              Add your first contact
            </button>
          </p>
        ) : (
          <>
            {contacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2 flex-1">
                  <button
                    onClick={() => handleTogglePrimary(contact.id, contact.isPrimary)}
                    className="hover:scale-110 transition-transform"
                    title="Toggle primary"
                  >
                    <Star className={`w-3.5 h-3.5 ${contact.isPrimary ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-700">{contact.contactType.label}</div>
                    <Input
                      value={contact.value}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setContacts(contacts.map(c => c.id === contact.id ? { ...c, value: newValue } : c));
                      }}
                      onBlur={(e) => handleUpdateContactValue(contact.id, e.target.value)}
                      className={inlineInputClass}
                      placeholder="Enter value"
                    />
                    <Input
                      value={contact.label || ""}
                      onChange={(e) => {
                        const newLabel = e.target.value;
                        setContacts(contacts.map(c => c.id === contact.id ? { ...c, label: newLabel } : c));
                      }}
                      onBlur={(e) => handleUpdateContactLabel(contact.id, e.target.value)}
                      className={inlineInputClass}
                      placeholder="Label (optional)"
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteContact(contact.id)}
                  className="p-1 hover:bg-red-50 rounded transition-colors"
                  title="Delete contact"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
            ))}

            {/* New contact row */}
            {showNewRow && (
              <div className="p-3 border-2 border-blue-200 rounded-lg space-y-3 bg-blue-50">
                <div className="space-y-2">
                  <Label className="text-sm">Contact Type</Label>
                  <Select 
                    value={newContact.contactTypeId} 
                    onValueChange={(value) => setNewContact({ ...newContact, contactTypeId: value })}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {contactTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Value</Label>
                  <Input
                    value={newContact.value}
                    onChange={(e) => setNewContact({ ...newContact, value: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newContact.contactTypeId && newContact.value) {
                        handleAddContact();
                      }
                    }}
                    placeholder="Enter contact value"
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Label (optional)</Label>
                  <Input
                    value={newContact.label}
                    onChange={(e) => setNewContact({ ...newContact, label: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newContact.contactTypeId && newContact.value) {
                        handleAddContact();
                      }
                    }}
                    placeholder="e.g., Work, Personal, Home"
                    className="bg-white"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAddContact}
                    disabled={!newContact.contactTypeId || !newContact.value}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Add Contact
                  </button>
                  <button
                    onClick={() => {
                      setShowNewRow(false);
                      setNewContact({ contactTypeId: "", value: "", label: "", isPrimary: false });
                    }}
                    className="px-3 py-1.5 bg-white text-gray-700 text-sm rounded border hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Add button at bottom */}
            {!showNewRow && (
              <button
                onClick={() => setShowNewRow(true)}
                className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Contact
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
