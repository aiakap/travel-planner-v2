/**
 * Graph Layout Algorithms
 * 
 * Automatic hub-and-spoke layout system for profile graph
 */

import { GraphData, GraphNode, GraphEdge, GraphCategory } from './types/profile-graph';

/**
 * Check if two nodes collide (overlap)
 */
function nodesCollide(
  node1: { x: number; y: number },
  node2: { x: number; y: number },
  minSpacing: number
): boolean {
  const dx = node1.x - node2.x;
  const dy = node1.y - node2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < minSpacing;
}

/**
 * Optimize item positions to prevent collisions
 */
function optimizeItemPositions(
  items: GraphNode[],
  hub: GraphNode,
  allNodes: GraphNode[],
  config: LayoutConfig
): GraphNode[] {
  if (!config.enableCollisionDetection || items.length === 0) {
    return items;
  }

  const optimizedItems = [...items];
  let iteration = 0;

  while (iteration < config.maxIterations) {
    let hasCollision = false;

    // Check each item against all other nodes
    for (let i = 0; i < optimizedItems.length; i++) {
      const item = optimizedItems[i];
      
      // Check collision with other items in this category
      for (let j = 0; j < optimizedItems.length; j++) {
        if (i === j) continue;
        
        if (nodesCollide(item, optimizedItems[j], config.itemSpacing)) {
          hasCollision = true;
          // Push item further out
          const angle = Math.atan2(item.y! - hub.y!, item.x! - hub.x!);
          const currentDistance = Math.sqrt(
            Math.pow(item.x! - hub.x!, 2) + Math.pow(item.y! - hub.y!, 2)
          );
          const newDistance = currentDistance + config.itemSpacing * 0.2;
          
          optimizedItems[i] = {
            ...item,
            x: hub.x! + Math.cos(angle) * newDistance,
            y: hub.y! + Math.sin(angle) * newDistance
          };
        }
      }

      // Check collision with nodes from other categories
      for (const otherNode of allNodes) {
        if (otherNode.id === item.id || otherNode.id === hub.id) continue;
        
        if (nodesCollide(item, otherNode, config.minNodeSpacing)) {
          hasCollision = true;
          // Push item further out
          const angle = Math.atan2(item.y! - hub.y!, item.x! - hub.x!);
          const currentDistance = Math.sqrt(
            Math.pow(item.x! - hub.x!, 2) + Math.pow(item.y! - hub.y!, 2)
          );
          const newDistance = currentDistance + config.minNodeSpacing * 0.15;
          
          optimizedItems[i] = {
            ...item,
            x: hub.x! + Math.cos(angle) * newDistance,
            y: hub.y! + Math.sin(angle) * newDistance
          };
        }
      }
    }

    if (!hasCollision) break;
    iteration++;
  }

  return optimizedItems;
}

export interface LayoutConfig {
  centerX: number;
  centerY: number;
  hubRadius: number; // Distance of hubs from center
  spokeLength: number; // Length of spokes from hub
  minSpokeAngle: number; // Minimum angle between spokes (degrees)
  minNodeSpacing: number; // Minimum space between nodes
  itemSpacing: number; // Space between item nodes
  enableCollisionDetection: boolean;
  maxIterations: number; // For collision resolution
}

const DEFAULT_LAYOUT: LayoutConfig = {
  centerX: 0,
  centerY: 0,
  hubRadius: 300,
  spokeLength: 180,
  minSpokeAngle: 20,
  minNodeSpacing: 100, // Minimum 100px between nodes
  itemSpacing: 80, // 80px between items
  enableCollisionDetection: true,
  maxIterations: 10
};

/**
 * Calculate hub-and-spoke layout
 * 
 * Structure:
 * - User node at center (0, 0)
 * - Category nodes (hubs) in circle around user
 * - Item nodes (spokes) radiate from their category hub
 * - Subnodes positioned between hub and items
 */
export function calculateHubSpokeLayout(
  graphData: GraphData,
  config: Partial<LayoutConfig> = {}
): GraphData {
  const layout = { ...DEFAULT_LAYOUT, ...config };
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // 1. User node at center (fixed)
  const userNode = graphData.nodes.find(n => n.type === 'user');
  if (userNode) {
    nodes.push({
      ...userNode,
      x: layout.centerX,
      y: layout.centerY
    });
  }

  // 2. Get all categories (hubs)
  const categoryNodes = graphData.nodes.filter(n => n.type === 'category');
  const totalCategories = categoryNodes.length;

  // 3. Position each category hub in a circle
  categoryNodes.forEach((category, index) => {
    const angle = (index / totalCategories) * 2 * Math.PI;
    const hubX = layout.centerX + Math.cos(angle) * layout.hubRadius;
    const hubY = layout.centerY + Math.sin(angle) * layout.hubRadius;

    nodes.push({
      ...category,
      x: hubX,
      y: hubY
    });

    // Add edge from user to category
    edges.push({
      from: 'user',
      to: category.id
    });

    // 4. Get items for this category
    const categoryItems = graphData.nodes.filter(
      n => n.type === 'item' && n.category === category.category
    );

    // Dynamic spoke length based on item count
    const itemCount = categoryItems.length;
    const dynamicSpokeLength = itemCount > 8 
      ? layout.spokeLength * (1 + (itemCount - 8) * 0.1) 
      : layout.spokeLength;

    // 5. Check for subnodes
    const subnodes = graphData.nodes.filter(
      n => n.type === 'subnode' && n.category === category.category
    );

    if (subnodes.length > 0) {
      // Layout with subnodes
      subnodes.forEach((subnode, subnodeIndex) => {
        // Get items for this subnode
        const subnodeItems = categoryItems.filter(
          item => item.metadata?.subcategory === subnode.subcategory
        );

        // Position subnode between hub and items
        const subnodeAngle = (subnodeIndex / Math.max(subnodes.length, 1)) * 2 * Math.PI;
        const subnodeDistance = layout.spokeLength * 0.5; // Halfway out
        const subnodeX = hubX + Math.cos(subnodeAngle) * subnodeDistance;
        const subnodeY = hubY + Math.sin(subnodeAngle) * subnodeDistance;

        nodes.push({
          ...subnode,
          x: subnodeX,
          y: subnodeY
        });

        // Edge from category to subnode
        edges.push({
          from: category.id,
          to: subnode.id
        });

        // Position items radiating from subnode
        subnodeItems.forEach((item, itemIndex) => {
          const itemAngle = subnodeAngle + 
            ((itemIndex - (subnodeItems.length - 1) / 2) * (layout.minSpokeAngle * Math.PI / 180));
          const itemX = subnodeX + Math.cos(itemAngle) * (layout.spokeLength * 0.5);
          const itemY = subnodeY + Math.sin(itemAngle) * (layout.spokeLength * 0.5);

          nodes.push({
            ...item,
            x: itemX,
            y: itemY
          });

          // Edge from subnode to item
          edges.push({
            from: subnode.id,
            to: item.id
          });
        });
      });

      // Handle items not in any subnode
      const itemsWithoutSubnode = categoryItems.filter(
        item => !subnodes.some(s => s.subcategory === item.metadata?.subcategory)
      );

      if (itemsWithoutSubnode.length > 0) {
        const startAngle = (subnodes.length / Math.max(subnodes.length + 1, 1)) * 2 * Math.PI;
        itemsWithoutSubnode.forEach((item, itemIndex) => {
          const itemAngle = startAngle + 
            ((itemIndex - (itemsWithoutSubnode.length - 1) / 2) * (layout.minSpokeAngle * Math.PI / 180));
          const itemX = hubX + Math.cos(itemAngle) * layout.spokeLength;
          const itemY = hubY + Math.sin(itemAngle) * layout.spokeLength;

          nodes.push({
            ...item,
            x: itemX,
            y: itemY
          });

          edges.push({
            from: category.id,
            to: item.id
          });
        });
      }
    } else {
      // No subnodes - items radiate directly from hub
      const totalItems = categoryItems.length;
      const tempItems: GraphNode[] = [];
      
      categoryItems.forEach((item, itemIndex) => {
        // Calculate angle for this spoke
        const baseAngle = angle; // Start from hub's angle
        const spreadAngle = Math.min(
          (totalItems * layout.minSpokeAngle * Math.PI / 180),
          Math.PI * 1.2 // Allow wider spread for many items
        );
        const itemAngle = baseAngle + 
          ((itemIndex - (totalItems - 1) / 2) * (spreadAngle / Math.max(totalItems - 1, 1)));

        // Position at end of spoke (use dynamic length)
        const itemX = hubX + Math.cos(itemAngle) * dynamicSpokeLength;
        const itemY = hubY + Math.sin(itemAngle) * dynamicSpokeLength;

        tempItems.push({
          ...item,
          x: itemX,
          y: itemY
        });
      });

      // Optimize positions to prevent collisions
      const optimizedItems = optimizeItemPositions(
        tempItems,
        { ...category, x: hubX, y: hubY },
        nodes,
        layout
      );

      // Add optimized items to nodes
      optimizedItems.forEach(item => {
        nodes.push(item);
        
        // Edge from category to item
        edges.push({
          from: category.id,
          to: item.id
        });
      });
    }
  });

  return { nodes, edges };
}

/**
 * Recalculate spoke positions when hub is dragged
 * 
 * Keeps hub at new position, recalculates all spoke endpoints
 */
export function recalculateSpokes(
  graphData: GraphData,
  hubId: string,
  newHubX: number,
  newHubY: number,
  config: Partial<LayoutConfig> = {}
): GraphData {
  const layout = { ...DEFAULT_LAYOUT, ...config };
  const nodes = [...graphData.nodes];
  
  // Find the hub node
  const hubIndex = nodes.findIndex(n => n.id === hubId);
  if (hubIndex === -1) return graphData;
  
  const hub = nodes[hubIndex];
  const oldHubX = hub.x || 0;
  const oldHubY = hub.y || 0;
  
  // Update hub position
  nodes[hubIndex] = { ...hub, x: newHubX, y: newHubY };
  
  // Find all nodes connected to this hub
  const connectedNodeIds = new Set<string>();
  
  // Direct children (subnodes or items)
  graphData.edges.forEach(edge => {
    if (edge.from === hubId) {
      connectedNodeIds.add(edge.to);
    }
  });
  
  // Grandchildren (items under subnodes)
  const subnodeIds = Array.from(connectedNodeIds).filter(id => {
    const node = nodes.find(n => n.id === id);
    return node?.type === 'subnode';
  });
  
  subnodeIds.forEach(subnodeId => {
    graphData.edges.forEach(edge => {
      if (edge.from === subnodeId) {
        connectedNodeIds.add(edge.to);
      }
    });
  });
  
  // Recalculate positions for all connected nodes
  connectedNodeIds.forEach(nodeId => {
    const nodeIndex = nodes.findIndex(n => n.id === nodeId);
    if (nodeIndex === -1) return;
    
    const node = nodes[nodeIndex];
    const oldX = node.x || 0;
    const oldY = node.y || 0;
    
    // Calculate relative position from old hub
    const relativeAngle = Math.atan2(oldY - oldHubY, oldX - oldHubX);
    const relativeDistance = Math.sqrt(
      Math.pow(oldX - oldHubX, 2) + Math.pow(oldY - oldHubY, 2)
    );
    
    // Apply same relative position to new hub
    const newX = newHubX + Math.cos(relativeAngle) * relativeDistance;
    const newY = newHubY + Math.sin(relativeAngle) * relativeDistance;
    
    nodes[nodeIndex] = { ...node, x: newX, y: newY };
  });
  
  return { nodes, edges: graphData.edges };
}

/**
 * Get layout configuration for canvas size
 */
export function getLayoutForCanvasSize(width: number, height: number): LayoutConfig {
  const minDimension = Math.min(width, height);
  
  return {
    centerX: 0,
    centerY: 0,
    hubRadius: minDimension * 0.25,
    spokeLength: minDimension * 0.15,
    minSpokeAngle: 20
  };
}
