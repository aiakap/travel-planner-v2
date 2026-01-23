"use client";

/**
 * Profile Graph Client Component
 * 
 * Main client component with split layout for chat and graph visualization
 */

import { useState } from "react";
import { GraphData } from "@/lib/types/profile-graph";
import { GraphChatInterface } from "@/components/graph-chat-interface";
import { ProfileGraphCanvas } from "@/components/profile-graph-canvas";
import { ProfileTextView } from "@/components/profile-text-view";
import { DeleteNodeModal } from "@/components/delete-node-modal";
import { ClearAllModal } from "@/components/clear-all-modal";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Trash2, MessageCircle, User, Network, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ProfileGraphClientProps {
  initialGraphData: GraphData;
  initialXmlData: string | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

type ViewMode = "graph" | "text";

export function ProfileGraphClient({
  initialGraphData,
  initialXmlData,
  user
}: ProfileGraphClientProps) {
  const [graphData, setGraphData] = useState<GraphData>(initialGraphData);
  const [xmlData, setXmlData] = useState<string | null>(initialXmlData);
  const [colorScheme, setColorScheme] = useState<string>("default");
  const [customColors, setCustomColors] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<ViewMode>("graph");
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    nodeId: string;
    nodeName: string;
    nodeType: 'item' | 'subnode' | 'category';
    category?: string;
    subcategory?: string;
    value?: string;
  }>({
    isOpen: false,
    nodeId: '',
    nodeName: '',
    nodeType: 'item'
  });
  const [clearAllModal, setClearAllModal] = useState(false);
  const router = useRouter();

  // Extract all current profile item values
  const getCurrentProfileValues = (): Set<string> => {
    const values = new Set<string>();
    graphData.nodes.forEach(node => {
      if (node.type === 'item' && node.value) {
        values.add(node.value.toLowerCase());
      }
    });
    return values;
  };

  // Handle message sent from chat
  const handleMessageSent = async (
    message: string,
    history: Array<{ role: "user" | "assistant"; content: string }>
  ) => {
    try {
      const response = await fetch("/api/profile-graph/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message,
          conversationHistory: history
        })
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();

      // Update graph data with auto-added items
      if (data.graphData) {
        console.log("📊 [Client] Updating graph with", data.graphData.nodes.length, "nodes");
        setGraphData(data.graphData);
      }
      if (data.xmlData) {
        setXmlData(data.xmlData);
      }

      // Log auto-added items
      if (data.addedItems && data.addedItems.length > 0) {
        console.log("✨ [Client] Auto-added items:", data.addedItems.map((i: any) => i.value).join(", "));
      }

      return {
        message: data.message,
        suggestions: data.suggestions || [],
        addedItems: data.addedItems || [],
        pendingSuggestions: data.pendingSuggestions || [],
        inlineSuggestions: data.inlineSuggestions || []
      };
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };

  // Handle new topic request
  const handleNewTopicRequested = async () => {
    try {
      const response = await fetch("/api/profile-graph/suggest-new-topic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          conversationHistory: [] // Could pass actual history if needed
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate new topic");
      }

      const data = await response.json();

      // Add the new topic message to chat
      // This would need to be handled through the GraphChatInterface
      // For now, we'll just log it
      console.log("New topic generated:", data.message);

      return data;
    } catch (error) {
      console.error("Error requesting new topic:", error);
      throw error;
    }
  };

  // Handle accepting a suggestion
  const handleSuggestionAccepted = async (suggestion: any) => {
    try {
      const response = await fetch("/api/profile-graph/add-item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          category: suggestion.category,
          subcategory: suggestion.subcategory,
          value: suggestion.value,
          metadata: suggestion.metadata
        })
      });

      if (!response.ok) {
        throw new Error("Failed to add item");
      }

      const data = await response.json();

      // Update graph with new item
      if (data.graphData) {
        setGraphData(data.graphData);
      }
      if (data.xmlData) {
        setXmlData(data.xmlData);
      }

      console.log("✅ Item added to profile:", suggestion.value);
    } catch (error) {
      console.error("Error accepting suggestion:", error);
      throw error;
    }
  };

  // Handle node deletion - show confirmation modal
  const handleNodeDelete = (nodeId: string) => {
    const node = graphData.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    setDeleteModal({
      isOpen: true,
      nodeId: nodeId,
      nodeName: node.value || node.label,
      nodeType: node.type as 'item' | 'subnode' | 'category',
      category: node.category,
      subcategory: node.metadata?.subcategory,
      value: node.value
    });
  };

  // Confirm node deletion
  const confirmNodeDelete = async () => {
    try {
      const response = await fetch("/api/profile-graph/delete-item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nodeId: deleteModal.nodeId,
          category: deleteModal.category,
          subcategory: deleteModal.subcategory,
          value: deleteModal.value
        })
      });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      const data = await response.json();

      // Update graph with item removed
      if (data.graphData) {
        setGraphData(data.graphData);
      }
      if (data.xmlData) {
        setXmlData(data.xmlData);
      }

      console.log("✅ Item deleted from profile");
    } catch (error) {
      console.error("Error deleting item:", error);
    } finally {
      setDeleteModal({ ...deleteModal, isOpen: false });
    }
  };

  // Handle node position changes (for persistence)
  const handleNodesChange = async (nodes: any[]) => {
    // TODO: Persist node positions to database
    console.log("Nodes changed:", nodes.length);
  };

  // Handle download XML
  const handleDownloadXml = () => {
    if (!xmlData) return;
    
    const blob = new Blob([xmlData], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `profile-graph-${new Date().toISOString().split("T")[0]}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle clear graph - show confirmation modal
  const handleClearGraph = () => {
    setClearAllModal(true);
  };

  // Confirm clear all
  const confirmClearAll = async () => {
    try {
      const response = await fetch("/api/profile-graph/clear", {
        method: "POST"
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Error clearing graph:", error);
    } finally {
      setClearAllModal(false);
    }
  };

  return (
    <div className="h-screen flex bg-slate-50">
      {/* Left Panel: Chat Interface */}
      <div className="w-2/5 border-r border-slate-200 flex flex-col bg-white">
        {/* Left Header */}
        <div className="border-b border-slate-200 p-4 bg-slate-50 h-16 flex items-center">
          <div className="flex items-center gap-3 w-full">
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="h-8">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <MessageCircle className="h-5 w-5 text-slate-700 flex-shrink-0" />
            <span className="text-sm font-medium text-slate-700">Chat:</span>
            <span className="text-sm text-slate-600">Tell me anything, I'll update your profile</span>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 overflow-hidden">
          <GraphChatInterface 
            onMessageSent={handleMessageSent}
            onSuggestionAccepted={handleSuggestionAccepted}
            onNewTopicRequested={handleNewTopicRequested}
            currentProfileValues={getCurrentProfileValues()}
          />
        </div>
      </div>

      {/* Right Panel: Profile Visualization */}
      <div className="flex-1 flex flex-col">
        {/* Right Header */}
        <div className="border-b border-slate-200 p-4 bg-slate-50 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-slate-700" />
            <span className="text-sm font-medium text-slate-700">Traveler Briefing</span>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex gap-1 border rounded-lg p-0.5 bg-white">
              <Button
                variant={viewMode === "graph" ? "default" : "ghost"}
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setViewMode("graph")}
                title="Graph View"
              >
                <Network className="h-3 w-3" />
              </Button>
              <Button
                variant={viewMode === "text" ? "default" : "ghost"}
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setViewMode("text")}
                title="Text View"
              >
                <FileText className="h-3 w-3" />
              </Button>
            </div>
            
            {/* Actions */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadXml}
              disabled={!xmlData}
              className="h-8"
            >
              <Download className="w-3 h-3 mr-1" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearGraph}
              className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear
            </Button>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {viewMode === "graph" ? (
            <ProfileGraphCanvas
              key={`graph-${graphData.nodes.length}-${Date.now()}`}
              graphData={graphData}
              colorScheme={colorScheme}
              customColors={customColors}
              onNodeDelete={handleNodeDelete}
              onNodesChange={handleNodesChange}
              onColorSchemeChange={setColorScheme}
              onCustomColorChange={(category, color) => {
                setCustomColors(prev => ({ ...prev, [category]: color }));
              }}
              onClearAll={handleClearGraph}
              className="h-full"
            />
          ) : (
            <ProfileTextView graphData={graphData} />
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteNodeModal
        isOpen={deleteModal.isOpen}
        nodeName={deleteModal.nodeName}
        nodeType={deleteModal.nodeType}
        onConfirm={confirmNodeDelete}
        onCancel={() => setDeleteModal({ ...deleteModal, isOpen: false })}
      />

      {/* Clear All Confirmation Modal */}
      <ClearAllModal
        isOpen={clearAllModal}
        categoryCount={graphData.nodes.filter(n => n.type === 'category').length}
        itemCount={graphData.nodes.filter(n => n.type === 'item').length}
        onConfirm={confirmClearAll}
        onCancel={() => setClearAllModal(false)}
      />
    </div>
  );
}
