"use client";

/**
 * Generic chat layout with split panels
 * Works for ANY object type - completely configuration-driven
 */

import { useState, useEffect } from "react";
import { ChatLayoutProps, PanelState } from "./types";
import { ChatPanel } from "./chat-panel";
import { DataPanel } from "./data-panel";
import { ResizableDivider } from "./resizable-divider";

const DEFAULT_PANEL_STATE: PanelState = {
  leftWidth: 40,
  isLeftCollapsed: false,
  isRightCollapsed: false,
};

export function ChatLayout({ 
  config, 
  userId, 
  initialData, 
  params 
}: ChatLayoutProps) {
  const [data, setData] = useState(initialData);
  const [xmlData, setXmlData] = useState<string>(initialData?.xmlData || '');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [panelState, setPanelState] = useState<PanelState>(DEFAULT_PANEL_STATE);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load panel state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`object-panel-state-${config.id}`);
    if (saved) {
      try {
        setPanelState(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load panel state:", e);
      }
    }
  }, [config.id]);

  // Save panel state to localStorage
  useEffect(() => {
    localStorage.setItem(
      `object-panel-state-${config.id}`,
      JSON.stringify(panelState)
    );
  }, [panelState, config.id]);

  // Refetch data when refresh is triggered
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chat-layout.tsx:53',message:'useEffect triggered',data:{refreshTrigger,willRefetch:refreshTrigger>0},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
    // #endregion
    if (refreshTrigger > 0) {
      const refetchData = async () => {
        try {
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chat-layout.tsx:58',message:'Starting refetch',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
          // #endregion
          const newData = await config.dataSource.fetch(userId, params);
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chat-layout.tsx:62',message:'Refetch complete',data:{hasGraphData:!!newData?.graphData,nodeCount:newData?.graphData?.nodes?.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
          // #endregion
          setData(newData);
        } catch (error) {
          console.error("Error refetching data:", error);
        }
      };
      refetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  // Calculate actual widths based on collapse state
  const actualLeftWidth = panelState.isLeftCollapsed 
    ? 0 
    : panelState.isRightCollapsed 
    ? 100 
    : panelState.leftWidth;
  
  const actualRightWidth = panelState.isRightCollapsed 
    ? 0 
    : panelState.isLeftCollapsed 
    ? 100 
    : 100 - panelState.leftWidth;

  const handleResize = (width: number) => {
    setPanelState(prev => ({ ...prev, leftWidth: width }));
  };

  const toggleLeftPanel = () => {
    setPanelState(prev => ({ ...prev, isLeftCollapsed: !prev.isLeftCollapsed }));
  };

  const toggleRightPanel = () => {
    setPanelState(prev => ({ ...prev, isRightCollapsed: !prev.isRightCollapsed }));
  };

  // Save handler - writes XML to DB and refreshes
  const handleSave = async () => {
    try {
      console.log('💾 Saving XML to database...');
      
      // Save XML to database
      const response = await fetch("/api/profile-graph/save-xml", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xmlData })
      });

      if (!response.ok) throw new Error("Save failed");

      const result = await response.json();
      
      // Update with fresh data from DB
      setXmlData(result.xmlData);
      
      // Parse and update graph data
      const { parseXmlToGraph } = await import("@/lib/profile-graph-xml");
      const graphData = parseXmlToGraph(result.xmlData, userId);
      setData({ graphData, xmlData: result.xmlData });
      setHasUnsavedChanges(false);
      
      console.log("✅ Saved to database successfully");
    } catch (error) {
      console.error("❌ Save failed:", error);
      alert("Failed to save. Please try again.");
    }
  };

  // Delete handler - refreshes data without reloading page
  const handleDelete = () => {
    console.log('🗑️ [CHAT LAYOUT] Item deleted, refreshing data...');
    setRefreshTrigger(prev => prev + 1);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "[") {
        e.preventDefault();
        toggleLeftPanel();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "]") {
        e.preventDefault();
        toggleRightPanel();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        setPanelState(DEFAULT_PANEL_STATE);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div style={{ display: "flex", height: "calc(100vh - 76px)", overflow: "hidden" }}>
      {/* Left Panel - Chat */}
      {!panelState.isLeftCollapsed && (
        <div
          style={{
            width: `${actualLeftWidth}%`,
            borderRight: "1px solid #e5e7eb",
            position: "relative",
            transition: "width 0.3s ease-in-out",
          }}
        >
          <ChatPanel
            config={config}
            userId={userId}
            params={params}
            xmlData={xmlData}
            onCollapse={toggleLeftPanel}
            onDataUpdate={(update) => {
              // #region agent log
              fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chat-layout.tsx:169',message:'onDataUpdate received',data:{type:typeof update,hasAction:update&&'action' in update,action:update?.action,hasGraphData:!!update?.graphData},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
              // #endregion
              console.log('🟣 [CHAT LAYOUT] onDataUpdate received:', {
                type: typeof update,
                hasAction: update && 'action' in update,
                action: update?.action,
                hasGraphData: !!update?.graphData,
                timestamp: new Date().toISOString()
              });
              
              if (typeof update === 'function') {
                console.log('🟣 [CHAT LAYOUT] Calling setData with function updater');
                setData(update);
              } else if (update && typeof update === 'object' && 'action' in update) {
                // Handle action-based updates
                console.log('🟣 [CHAT LAYOUT] Handling action:', update.action);
                if (update.action === 'refresh_profile' || update.action === 'reload_data') {
                  // #region agent log
                  fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chat-layout.tsx:186',message:'Incrementing refreshTrigger',data:{currentTrigger:refreshTrigger},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
                  // #endregion
                  console.log('🔄 [CHAT LAYOUT] Reloading data from database...');
                  setRefreshTrigger(prev => prev + 1);
                }
              } else if (update && update.graphData) {
                // Wrap the graphData to match expected structure
                console.log('🟣 [CHAT LAYOUT] Wrapping graphData with', update.graphData.nodes?.length, 'nodes');
                
                // Keep the same structure as fetchProfileData returns
                setData({
                  graphData: update.graphData,
                  hasData: update.graphData.nodes?.length > 1
                });
                
                // Update XML data and mark as unsaved if XML is provided
                if (update.xmlData) {
                  setXmlData(update.xmlData);
                  setHasUnsavedChanges(true);
                  console.log('🟣 [CHAT LAYOUT] XML updated, marked as unsaved');
                }
              } else {
                // Fallback for other update types
                console.log('🟣 [CHAT LAYOUT] Setting data directly');
                setData(update);
              }
            }}
          />
        </div>
      )}

      {/* Resizable Divider */}
      {!panelState.isLeftCollapsed && !panelState.isRightCollapsed && (
        <ResizableDivider onResize={handleResize} />
      )}

      {/* Expand Left Button */}
      {panelState.isLeftCollapsed && (
        <button
          onClick={toggleLeftPanel}
          style={{
            position: "fixed",
            left: "0",
            top: "50%",
            transform: "translateY(-50%)",
            padding: "8px 12px",
            background: "white",
            border: "1px solid #e5e7eb",
            borderLeft: "none",
            borderRadius: "0 8px 8px 0",
            boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
            cursor: "pointer",
            zIndex: 10,
            fontSize: "14px",
          }}
          title="Expand chat (Cmd+[)"
        >
          →
        </button>
      )}

      {/* Right Panel - Data View */}
      {!panelState.isRightCollapsed && (
        <div
          style={{
            width: `${actualRightWidth}%`,
            position: "relative",
            transition: "width 0.3s ease-in-out",
          }}
        >
          <DataPanel 
            config={config} 
            data={data} 
            params={params}
            hasUnsavedChanges={hasUnsavedChanges}
            onSave={handleSave}
            onDelete={handleDelete}
            onCollapse={toggleRightPanel}
            onDataUpdate={(update) => {
              console.log('📊 DataPanel triggered update:', {
                hasGraphData: !!update?.graphData,
                nodeCount: update?.graphData?.nodes?.length
              });
              // Use the same logic as ChatPanel's onDataUpdate
              if (update && update.graphData) {
                setData({
                  graphData: update.graphData,
                  hasData: update.graphData.nodes?.length > 1
                });
                if (update.xmlData) {
                  setXmlData(update.xmlData);
                  setHasUnsavedChanges(true);
                }
              }
            }}
          />
        </div>
      )}

      {/* Expand Right Button */}
      {panelState.isRightCollapsed && (
        <button
          onClick={toggleRightPanel}
          style={{
            position: "fixed",
            right: "0",
            top: "50%",
            transform: "translateY(-50%)",
            padding: "8px 12px",
            background: "white",
            border: "1px solid #e5e7eb",
            borderRight: "none",
            borderRadius: "8px 0 0 8px",
            boxShadow: "-2px 0 8px rgba(0,0,0,0.1)",
            cursor: "pointer",
            zIndex: 10,
            fontSize: "14px",
          }}
          title="Expand data view (Cmd+])"
        >
          ←
        </button>
      )}
    </div>
  );
}
