"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteRelationship } from "@/lib/actions/profile-actions";
import { Users, Trash2 } from "lucide-react";

interface RelationshipsSectionProps {
  initialRelationships: any[];
}

export function RelationshipsSection({ initialRelationships }: RelationshipsSectionProps) {
  const [relationships, setRelationships] = useState(initialRelationships);

  const handleDeleteRelationship = async (relationshipId: string) => {
    try {
      await deleteRelationship(relationshipId);
      setRelationships(relationships.filter(r => r.id !== relationshipId));
    } catch (error) {
      console.error("Error deleting relationship:", error);
    }
  };

  const relationshipTypeLabels: Record<string, string> = {
    spouse: "Spouse",
    partner: "Partner",
    child: "Child",
    parent: "Parent",
    sibling: "Sibling",
    friend: "Friend",
    travel_companion: "Travel Companion",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Relationships</h2>
          <p className="text-sm text-gray-600 mt-1">Manage your travel companions and family connections.</p>
        </div>
      </div>

      <div className="space-y-3">
        {relationships.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No relationships added yet.</p>
            <p className="text-sm">Add connections to plan group trips together.</p>
          </div>
        ) : (
          relationships.map((relationship) => (
            <div
              key={relationship.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-4">
                {relationship.relatedUser.image ? (
                  <img
                    src={relationship.relatedUser.image}
                    alt={relationship.relatedUser.name}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <Users className="w-5 h-5 text-gray-500" />
                  </div>
                )}
                <div>
                  <div className="font-medium">
                    {relationship.nickname || relationship.relatedUser.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {relationship.relatedUser.email}
                  </div>
                  <div className="mt-1">
                    <Badge variant="secondary">
                      {relationshipTypeLabels[relationship.relationshipType] || relationship.relationshipType}
                    </Badge>
                  </div>
                  {relationship.notes && (
                    <div className="text-xs text-gray-500 mt-1">{relationship.notes}</div>
                  )}
                </div>
              </div>
              <Button
                onClick={() => handleDeleteRelationship(relationship.id)}
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
