"use client";

import { GraphData, GRAPH_CATEGORIES, GraphNode } from "@/lib/types/profile-graph";

interface ProfileTextViewProps {
  graphData: GraphData;
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

export function ProfileTextView({ graphData }: ProfileTextViewProps) {
  // Group items by category and subcategory
  const groupedData = groupProfileData(graphData);
  
  return (
    <div className="h-full overflow-y-auto p-6 bg-white">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Travel Profile</h2>
          <p className="text-sm text-slate-600">
            This is everything we know about your preferences, style, and interests.
          </p>
        </div>
        
        {groupedData.map((category) => (
          <div key={category.id} className="border-l-4 pl-4" style={{ borderColor: category.color }}>
            <h3 className="text-lg font-semibold text-slate-900 mb-3">{category.label}</h3>
            
            {category.subcategories.map((subcat) => (
              <div key={subcat.name} className="mb-3">
                <h4 className="text-sm font-medium text-slate-700 mb-1.5">
                  {formatSubcategoryName(subcat.name)}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {subcat.items.map((item) => (
                    <span
                      key={item.id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-slate-100 text-slate-700"
                    >
                      {item.value}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            
            {category.uncategorizedItems.length > 0 && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-2">
                  {category.uncategorizedItems.map((item) => (
                    <span
                      key={item.id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-slate-100 text-slate-700"
                    >
                      {item.value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        
        {groupedData.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No profile data yet. Start chatting to build your profile!</p>
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
