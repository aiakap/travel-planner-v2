"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Plus, Trash2, Star } from "lucide-react";

interface ContactsSectionProps {
  initialContacts: any[];
  contactTypes: any[];
}

export function ContactsSection({ initialContacts, contactTypes }: ContactsSectionProps) {
  const [contacts, setContacts] = useState(initialContacts);
  const [isAdding, setIsAdding] = useState(false);
  const [newContact, setNewContact] = useState({
    contactTypeId: "",
    value: "",
    label: "",
    isPrimary: false,
  });

  const handleAddContact = async () => {
    if (!newContact.contactTypeId || !newContact.value) return;

    try {
      const added = await addContact(newContact);
      setContacts([...contacts, { ...added, contactType: contactTypes.find(ct => ct.id === newContact.contactTypeId) }]);
      setNewContact({ contactTypeId: "", value: "", label: "", isPrimary: false });
      setIsAdding(false);
    } catch (error) {
      console.error("Error adding contact:", error);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Contact Information</h2>
        <Button onClick={() => setIsAdding(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {isAdding && (
        <div className="p-4 border rounded-lg space-y-4 bg-gray-50">
          <div className="space-y-2">
            <Label>Contact Type</Label>
            <Select value={newContact.contactTypeId} onValueChange={(value) => setNewContact({ ...newContact, contactTypeId: value })}>
              <SelectTrigger>
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
            <Label>Value</Label>
            <Input
              value={newContact.value}
              onChange={(e) => setNewContact({ ...newContact, value: e.target.value })}
              placeholder="Enter contact value"
            />
          </div>

          <div className="space-y-2">
            <Label>Label (optional)</Label>
            <Input
              value={newContact.label}
              onChange={(e) => setNewContact({ ...newContact, label: e.target.value })}
              placeholder="e.g., Work, Personal, Home"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleAddContact} size="sm">Save</Button>
            <Button onClick={() => setIsAdding(false)} variant="outline" size="sm">Cancel</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {contacts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No contacts added yet.</p>
        ) : (
          contacts.map((contact) => (
            <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleTogglePrimary(contact.id, contact.isPrimary)}
                  className="hover:scale-110 transition-transform"
                >
                  <Star className={`w-4 h-4 ${contact.isPrimary ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                </button>
                <div>
                  <div className="font-medium">{contact.contactType.label}</div>
                  <div className="text-sm text-gray-600">{contact.value}</div>
                  {contact.label && (
                    <div className="text-xs text-gray-500">{contact.label}</div>
                  )}
                </div>
              </div>
              <Button
                onClick={() => handleDeleteContact(contact.id)}
                variant="ghost"
                size="sm"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
