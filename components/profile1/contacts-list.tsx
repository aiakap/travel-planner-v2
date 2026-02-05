"use client";

import { useState } from "react";
import { Phone, Mail, Globe, Instagram, Edit3, Trash2, Plus } from "lucide-react";
import { addContact, updateContact, deleteContact } from "@/lib/actions/profile-actions";
import { useToast } from "@/hooks/use-toast";
import { UserContact, ContactType } from "@/lib/types/profile";

interface ContactsListProps {
  initialContacts: UserContact[];
  contactTypes: ContactType[];
}

const cardClass = "bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100";
const inputClass =
  "w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all";
const labelClass = "text-xs font-semibold text-gray-500 uppercase tracking-wide";

function getContactIcon(typeName: string) {
  const name = typeName.toLowerCase();
  if (name.includes("phone") || name.includes("whatsapp") || name.includes("mobile") || name.includes("cell")) {
    if (name.includes("whatsapp")) {
      return <Phone size={18} className="text-green-600" />;
    }
    return <Phone size={18} />;
  }
  if (name.includes("email") || name.includes("mail")) {
    return <Mail size={18} />;
  }
  if (name.includes("instagram")) {
    return <Instagram size={18} className="text-pink-600" />;
  }
  if (name.includes("website") || name.includes("web") || name.includes("url")) {
    return <Globe size={18} />;
  }
  return <Mail size={18} />;
}

export function ContactsList({ initialContacts, contactTypes }: ContactsListProps) {
  const [contacts, setContacts] = useState(initialContacts);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newContact, setNewContact] = useState({
    contactTypeId: "",
    value: "",
    label: "",
    isPrimary: false,
  });
  const { toast } = useToast();

  const handleAddContact = async () => {
    if (!newContact.contactTypeId || !newContact.value) return;

    try {
      const added = await addContact(newContact);
      const contactType = contactTypes.find((ct) => ct.id === newContact.contactTypeId);
      setContacts([...contacts, { ...added, contactType: contactType! }]);
      setNewContact({ contactTypeId: "", value: "", label: "", isPrimary: false });
      setShowNewForm(false);
      toast({ title: "Contact added" });
    } catch (error) {
      console.error("Error adding contact:", error);
      toast({ title: "Error", description: "Failed to add contact", variant: "destructive" });
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      await deleteContact(contactId);
      setContacts(contacts.filter((c) => c.id !== contactId));
      toast({ title: "Contact deleted" });
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast({ title: "Error", description: "Failed to delete contact", variant: "destructive" });
    }
  };

  const handleUpdateContact = async (contactId: string, data: { value?: string; label?: string }) => {
    try {
      await updateContact(contactId, data);
      setContacts(contacts.map((c) => (c.id === contactId ? { ...c, ...data } : c)));
      setEditingId(null);
      toast({ title: "Contact updated" });
    } catch (error) {
      console.error("Error updating contact:", error);
      toast({ title: "Error", description: "Failed to update contact", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black transition-colors shadow-sm"
        >
          <Plus size={16} /> Add Contact
        </button>
      </div>

      {/* New Contact Form */}
      {showNewForm && (
        <div className={`${cardClass} p-6 space-y-4`}>
          <div className="space-y-2">
            <label className={labelClass}>Contact Type</label>
            <select
              value={newContact.contactTypeId}
              onChange={(e) => setNewContact({ ...newContact, contactTypeId: e.target.value })}
              className={inputClass}
            >
              <option value="">Select type</option>
              {contactTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className={labelClass}>Value</label>
            <input
              type="text"
              value={newContact.value}
              onChange={(e) => setNewContact({ ...newContact, value: e.target.value })}
              placeholder="Enter contact value"
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label className={labelClass}>Label (optional)</label>
            <input
              type="text"
              value={newContact.label}
              onChange={(e) => setNewContact({ ...newContact, label: e.target.value })}
              placeholder="e.g. Personal, Work"
              className={inputClass}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAddContact}
              disabled={!newContact.contactTypeId || !newContact.value}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Contact
            </button>
            <button
              onClick={() => {
                setShowNewForm(false);
                setNewContact({ contactTypeId: "", value: "", label: "", isPrimary: false });
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Contact List */}
      <div className="grid gap-4">
        {contacts.length === 0 && !showNewForm ? (
          <div className={`${cardClass} p-8 text-center`}>
            <p className="text-gray-500">
              No contacts added yet.{" "}
              <button onClick={() => setShowNewForm(true)} className="text-gray-900 font-medium hover:underline">
                Add your first contact
              </button>
            </p>
          </div>
        ) : (
          contacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-white rounded-xl p-5 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow group flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
                  {getContactIcon(contact.contactType?.name || "")}
                </div>
                <div>
                  {editingId === contact.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        defaultValue={contact.value}
                        onBlur={(e) => handleUpdateContact(contact.id, { value: e.target.value })}
                        className="font-semibold text-gray-900 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{contact.value}</span>
                      </div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium bg-gray-100 inline-block px-2 py-0.5 rounded">
                        {contact.contactType?.name}
                        {contact.label ? ` • ${contact.label}` : ""}
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity self-end md:self-center">
                <button
                  onClick={() => setEditingId(editingId === contact.id ? null : contact.id)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => handleDeleteContact(contact.id)}
                  className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
