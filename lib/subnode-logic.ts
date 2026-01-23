/**
 * Subnode Logic
 * 
 * Handles automatic creation of subnodes when 2+ items share a subcategory
 */

import { GraphData, GraphNode, GraphEdge, GraphCategory } from './types/profile-graph';

export interface SubnodeInfo {
  id: string;
  category: GraphCategory;
  subcategory: string;
  itemIds: string[];
  itemCount: number;
}

/**
 * Analyze graph data and identify where subnodes should be created
 */
export function analyzeSubnodes(graphData: GraphData): SubnodeInfo[] {
  const subcategoryGroups = new Map<string, GraphNode[]>();
  
  // Group items by category + subcategory
  graphData.nodes.forEach(node => {
    if (node.type === 'item' && node.category && node.metadata?.subcategory) {
      const key = `${node.category}-${node.metadata.subcategory}`;
      if (!subcategoryGroups.has(key)) {
        subcategoryGroups.set(key, []);
      }
      subcategoryGroups.get(key)!.push(node);
    }
  });
  
  // Find groups with 2+ items (should have subnodes)
  const subnodeInfos: SubnodeInfo[] = [];
  
  subcategoryGroups.forEach((items, key) => {
    if (items.length >= 2) {
      const [category, subcategory] = key.split('-');
      subnodeInfos.push({
        id: `subnode-${key}`,
        category: category as GraphCategory,
        subcategory,
        itemIds: items.map(item => item.id),
        itemCount: items.length
      });
    }
  });
  
  return subnodeInfos;
}

/**
 * Create subnode nodes and reorganize edges
 */
export function createSubnodes(graphData: GraphData): GraphData {
  const subnodeInfos = analyzeSubnodes(graphData);
  
  if (subnodeInfos.length === 0) {
    return graphData; // No subnodes needed
  }
  
  const newNodes: GraphNode[] = [...graphData.nodes];
  const newEdges: GraphEdge[] = [];
  const subnodeIds = new Set(subnodeInfos.map(info => info.id));
  
  // Add subnode nodes
  subnodeInfos.forEach(info => {
    // Find the category node
    const categoryNode = graphData.nodes.find(
      n => n.type === 'category' && n.category === info.category
    );
    
    if (!categoryNode) return;
    
    // Calculate position between category and items
    const items = graphData.nodes.filter(n => info.itemIds.includes(n.id));
    const avgX = items.reduce((sum, item) => sum + (item.x || 0), 0) / items.length;
    const avgY = items.reduce((sum, item) => sum + (item.y || 0), 0) / items.length;
    
    // Position subnode between category and items
    const subnodeX = ((categoryNode.x || 0) + avgX) / 2;
    const subnodeY = ((categoryNode.y || 0) + avgY) / 2;
    
    // Check if subnode already exists
    const existingSubnode = newNodes.find(n => n.id === info.id);
    
    if (!existingSubnode) {
      newNodes.push({
        id: info.id,
        type: 'subnode',
        category: info.category,
        subcategory: info.subcategory,
        label: formatSubcategoryLabel(info.subcategory),
        x: subnodeX,
        y: subnodeY,
        size: 40,
        color: categoryNode.color,
        itemCount: info.itemCount
      });
    }
  });
  
  // Reorganize edges
  graphData.edges.forEach(edge => {
    const targetNode = graphData.nodes.find(n => n.id === edge.to);
    
    if (targetNode && targetNode.type === 'item') {
      // Check if this item should be under a subnode
      const subnodeInfo = subnodeInfos.find(info => 
        info.itemIds.includes(edge.to)
      );
      
      if (subnodeInfo) {
        // Check if edge from category to subnode exists
        const categoryToSubnodeExists = newEdges.some(
          e => e.from === edge.from && e.to === subnodeInfo.id
        );
        
        if (!categoryToSubnodeExists) {
          newEdges.push({
            from: edge.from,
            to: subnodeInfo.id
          });
        }
        
        // Add edge from subnode to item
        newEdges.push({
          from: subnodeInfo.id,
          to: edge.to
        });
      } else {
        // Keep original edge (item doesn't belong to a subnode)
        newEdges.push(edge);
      }
    } else {
      // Keep non-item edges
      newEdges.push(edge);
    }
  });
  
  return {
    nodes: newNodes,
    edges: newEdges
  };
}

/**
 * Format subcategory name for display
 */
function formatSubcategoryLabel(subcategory: string): string {
  return subcategory
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Check if a specific subcategory should have a subnode
 */
export function shouldCreateSubnode(
  graphData: GraphData,
  category: GraphCategory,
  subcategory: string
): boolean {
  const items = graphData.nodes.filter(
    node => 
      node.type === 'item' &&
      node.category === category &&
      node.metadata?.subcategory === subcategory
  );
  
  return items.length >= 2;
}
