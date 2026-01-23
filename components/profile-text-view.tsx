"use client";

import { GraphData, GRAPH_CATEGORIES, GraphNode } from "@/lib/types/profile-graph";
import { X } from "lucide-react";
import { useState } from "react";

interface ProfileTextViewProps {
  graphData: GraphData;
  onNodeDelete?: (nodeId: string) => void;
}

interface GroupedCategory {
  id: string;
  label: string;
  color: string;
  subcategories: {
    name: string;
    items: GraphNode[];
  }[];
  uncategorizedItems: GraphNode[];
}

export function ProfileTextView({ graphData, onNodeDelete }: ProfileTextViewProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  
  // Group items by category and subcategory
  const groupedData = groupProfileData(graphData);
  
  const handleDelete = (item: GraphNode) => {
    if (onNodeDelete) {
      onNodeDelete(item.id);
    }
  };
  
  return (
    <div className="h-full overflow-y-auto p-4 bg-white">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-900 mb-1">Your Travel Profile</h2>
          <p className="text-xs text-slate-600">
            Hover over items to remove them
          </p>
        </div>
        
        {groupedData.map((category) => (
          <div key={category.id} className="border-l-3 pl-3 py-1" style={{ borderColor: category.color }}>
            <h3 className="text-sm font-semibold text-slate-900 mb-2">{category.label}</h3>
            
            {category.subcategories.map((subcat) => (
              <div key={subcat.name} className="mb-2">
                <h4 className="text-xs font-medium text-slate-600 mb-1">
                  {formatSubcategoryName(subcat.name)}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {subcat.items.map((item) => (
                    <div
                      key={item.id}
                      className="group relative inline-flex items-center"
                      onMouseEnter={() => setHoveredItem(item.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-default">
                        {item.value}
                      </span>
                      {hoveredItem === item.id && onNodeDelete && (
                        <button
                          onClick={() => handleDelete(item)}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-sm transition-colors"
                          title="Delete"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {category.uncategorizedItems.length > 0 && (
              <div className="mb-2">
                <div className="flex flex-wrap gap-1.5">
                  {category.uncategorizedItems.map((item) => (
                    <div
                      key={item.id}
                      className="group relative inline-flex items-center"
                      onMouseEnter={() => setHoveredItem(item.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-default">
                        {item.value}
                      </span>
                      {hoveredItem === item.id && onNodeDelete && (
                        <button
                          onClick={() => handleDelete(item)}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-sm transition-colors"
                          title="Delete"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        
        {groupedData.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 text-sm">No profile data yet. Start chatting to build your profile!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function groupProfileData(graphData: GraphData): GroupedCategory[] {
  const grouped: GroupedCategory[] = [];
  
  // Get all item nodes (actual profile data points)
  const itemNodes = graphData.nodes.filter(node => node.type === 'item');
  
  // Group by category
  GRAPH_CATEGORIES.forEach(categoryConfig => {
    const categoryItems = itemNodes.filter(node => node.category === categoryConfig.id);
    
    if (categoryItems.length === 0) return; // Skip empty categories
    
    // Group items by subcategory
    const subcategoryMap = new Map<string, GraphNode[]>();
    const uncategorizedItems: GraphNode[] = [];
    
    categoryItems.forEach(item => {
      const subcategory = item.metadata?.subcategory;
      if (subcategory) {
        if (!subcategoryMap.has(subcategory)) {
          subcategoryMap.set(subcategory, []);
        }
        subcategoryMap.get(subcategory)!.push(item);
      } else {
        uncategorizedItems.push(item);
      }
    });
    
    // Convert map to array
    const subcategories = Array.from(subcategoryMap.entries()).map(([name, items]) => ({
      name,
      items
    }));
    
    grouped.push({
      id: categoryConfig.id,
      label: categoryConfig.label,
      color: categoryConfig.color,
      subcategories,
      uncategorizedItems
    });
  });
  
  return grouped;
}

function formatSubcategoryName(name: string): string {
  return name.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}
