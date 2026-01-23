/**
 * Profile Graph XML Utilities
 * 
 * Functions for parsing, manipulating, and validating XML data for the profile graph
 */

import { GraphData, GraphNode, GraphEdge, ProfileGraphItem, GraphCategory, GRAPH_CATEGORIES } from "./types/profile-graph";
import { createSubnodes } from "./subnode-logic";
import { calculateHubSpokeLayout } from "./graph-layout";

/**
 * Create an empty profile XML structure
 * Now returns minimal structure - categories are added dynamically as needed
 */
export function createEmptyProfileXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<profile>
</profile>`;
}

/**
 * Parse XML string to DOM Document
 */
function parseXmlString(xmlString: string): Document {
  if (typeof DOMParser !== 'undefined') {
    // Browser environment
    const parser = new DOMParser();
    return parser.parseFromString(xmlString, "text/xml");
  } else {
    // Node.js environment - use a simple regex-based parser for server-side
    // For production, consider using a library like 'fast-xml-parser'
    throw new Error("XML parsing in Node.js requires a library like fast-xml-parser");
  }
}

/**
 * Serialize DOM Document to XML string
 */
function serializeXml(doc: Document): string {
  if (typeof XMLSerializer !== 'undefined') {
    // Browser environment
    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
  } else {
    // Node.js environment
    throw new Error("XML serialization in Node.js requires a library");
  }
}

/**
 * Simple server-side XML parser using regex
 * This is a basic implementation for server-side use
 */
function parseXmlSimple(xmlString: string): any {
  const result: any = {};
  
  // Remove XML declaration
  xmlString = xmlString.replace(/<\?xml[^?]*\?>/g, '');
  
  // Extract profile content
  const profileMatch = xmlString.match(/<profile>([\s\S]*)<\/profile>/);
  if (!profileMatch) return result;
  
  const content = profileMatch[1];
  
  // Parse each category
  const categoryRegex = /<([^>\/\s]+)>([\s\S]*?)<\/\1>/g;
  let match;
  
  while ((match = categoryRegex.exec(content)) !== null) {
    const categoryName = match[1];
    const categoryContent = match[2];
    
    result[categoryName] = {};
    
    // Parse subcategories
    const subcategoryRegex = /<([^>\/\s]+)>([\s\S]*?)<\/\1>/g;
    let subMatch;
    
    while ((subMatch = subcategoryRegex.exec(categoryContent)) !== null) {
      const subName = subMatch[1];
      const subContent = subMatch[2];
      
      // Parse items
      const items: any[] = [];
      const itemRegex = /<item([^>]*)>([\s\S]*?)<\/item>/g;
      let itemMatch;
      
      while ((itemMatch = itemRegex.exec(subContent)) !== null) {
        const attributes = itemMatch[1];
        const value = itemMatch[2].trim();
        
        const item: any = { value };
        
        // Parse attributes
        const attrRegex = /(\w+)="([^"]*)"/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(attributes)) !== null) {
          item[attrMatch[1]] = attrMatch[2];
        }
        
        items.push(item);
      }
      
      result[categoryName][subName] = items;
    }
  }
  
  return result;
}

/**
 * Convert parsed XML object to XML string
 */
function objectToXml(obj: any): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<profile>\n';
  
  for (const [categoryName, categoryData] of Object.entries(obj)) {
    xml += `  <${categoryName}>\n`;
    
    if (typeof categoryData === 'object' && categoryData !== null) {
      for (const [subName, items] of Object.entries(categoryData)) {
        xml += `    <${subName}>`;
        
        if (Array.isArray(items) && items.length > 0) {
          xml += '\n';
          for (const item of items) {
            const { value, ...attrs } = item;
            const attrString = Object.entries(attrs)
              .map(([key, val]) => `${key}="${val}"`)
              .join(' ');
            xml += `      <item${attrString ? ' ' + attrString : ''}>${value}</item>\n`;
          }
          xml += `    `;
        }
        
        xml += `</${subName}>\n`;
      }
    }
    
    xml += `  </${categoryName}>\n`;
  }
  
  xml += '</profile>';
  return xml;
}

/**
 * Parse XML to GraphData structure for visualization
 */
export function parseXmlToGraph(xmlString: string | null, userId: string, userName?: string): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  
  // Add user node at center
  nodes.push({
    id: "user",
    type: "user",
    label: userName || "You",
    x: 0,
    y: 0,
    size: 60,
    color: "#ffffff"
  });
  
  if (!xmlString || xmlString.trim() === '') {
    xmlString = createEmptyProfileXml();
  }
  
  try {
    const parsed = parseXmlSimple(xmlString);
    
    // Create category nodes and item nodes
    let categoryIndex = 0;
    const totalCategories = Object.keys(parsed).length;
    
    for (const [categoryName, categoryData] of Object.entries(parsed)) {
      const categoryConfig = GRAPH_CATEGORIES.find(c => c.id === categoryName);
      if (!categoryConfig) continue;
      
      // Calculate position for category node (radial layout)
      const angle = (categoryIndex / totalCategories) * 2 * Math.PI;
      const radius = 200;
      const categoryX = Math.cos(angle) * radius;
      const categoryY = Math.sin(angle) * radius;
      
      const categoryId = `category-${categoryName}`;
      
      // Count items in this category
      let itemCount = 0;
      if (typeof categoryData === 'object' && categoryData !== null) {
        for (const items of Object.values(categoryData)) {
          if (Array.isArray(items)) {
            itemCount += items.length;
          }
        }
      }
      
      // Add category node
      nodes.push({
        id: categoryId,
        type: "category",
        category: categoryName as GraphCategory,
        label: categoryConfig.label,
        x: categoryX,
        y: categoryY,
        size: 40 + (itemCount * 2),
        color: categoryConfig.color,
        itemCount: itemCount
      });
      
      // Add edge from user to category
      edges.push({
        from: "user",
        to: categoryId
      });
      
      // Add item nodes
      if (typeof categoryData === 'object' && categoryData !== null) {
        let itemIndex = 0;
        const totalItems = itemCount;
        
        for (const [subName, items] of Object.entries(categoryData)) {
          if (Array.isArray(items)) {
            for (const item of items) {
              const itemId = `item-${categoryName}-${subName}-${itemIndex}`;
              
              // Position items around their category
              const itemAngle = (itemIndex / Math.max(totalItems, 1)) * 2 * Math.PI;
              const itemRadius = 80;
              const itemX = categoryX + Math.cos(itemAngle) * itemRadius;
              const itemY = categoryY + Math.sin(itemAngle) * itemRadius;
              
              nodes.push({
                id: itemId,
                type: "item",
                category: categoryName as GraphCategory,
                label: item.value,
                value: item.value,
                metadata: { subcategory: subName, ...item },
                x: itemX,
                y: itemY,
                size: 20,
                color: categoryConfig.color
              });
              
              // Add edge from category to item
              edges.push({
                from: categoryId,
                to: itemId
              });
              
              itemIndex++;
            }
          }
        }
      }
      
      categoryIndex++;
    }
  } catch (error) {
    console.error("Error parsing XML to graph:", error);
  }
  
  // Apply subnode logic to create subnodes for groups of 2+ items
  const graphWithSubnodes = createSubnodes({ nodes, edges });
  
  // Apply hub-and-spoke layout
  const layoutedGraph = calculateHubSpokeLayout(graphWithSubnodes);
  
  return layoutedGraph;
}

/**
 * Add a new item to the XML
 */
export function addItemToXml(
  xmlString: string | null,
  category: string,
  subcategory: string,
  value: string,
  metadata?: Record<string, string>
): string {
  if (!xmlString || xmlString.trim() === '') {
    xmlString = createEmptyProfileXml();
  }
  
  try {
    const parsed = parseXmlSimple(xmlString);
    
    // Ensure category exists
    if (!parsed[category]) {
      parsed[category] = {};
    }
    
    // Ensure subcategory exists
    if (!parsed[category][subcategory]) {
      parsed[category][subcategory] = [];
    }
    
    // Add item
    const item: any = { value, ...metadata };
    parsed[category][subcategory].push(item);
    
    return objectToXml(parsed);
  } catch (error) {
    console.error("Error adding item to XML:", error);
    return xmlString;
  }
}

/**
 * Remove an item from the XML
 */
export function removeItemFromXml(
  xmlString: string | null,
  category: string,
  subcategory: string,
  value: string
): string {
  if (!xmlString || xmlString.trim() === '') {
    return createEmptyProfileXml();
  }
  
  try {
    const parsed = parseXmlSimple(xmlString);
    
    if (parsed[category]?.[subcategory]) {
      parsed[category][subcategory] = parsed[category][subcategory].filter(
        (item: any) => item.value !== value
      );
    }
    
    return objectToXml(parsed);
  } catch (error) {
    console.error("Error removing item from XML:", error);
    return xmlString;
  }
}

/**
 * Validate XML structure
 */
export function validateXml(xmlString: string): boolean {
  if (!xmlString || xmlString.trim() === '') {
    return false;
  }
  
  try {
    // Check for basic XML structure
    if (!xmlString.includes('<?xml') || !xmlString.includes('<profile>')) {
      return false;
    }
    
    // Try to parse
    parseXmlSimple(xmlString);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Extract all items from XML as a flat array
 */
export function extractItemsFromXml(xmlString: string | null): ProfileGraphItem[] {
  if (!xmlString || xmlString.trim() === '') {
    return [];
  }
  
  const items: ProfileGraphItem[] = [];
  
  try {
    const parsed = parseXmlSimple(xmlString);
    
    for (const [categoryName, categoryData] of Object.entries(parsed)) {
      if (typeof categoryData === 'object' && categoryData !== null) {
        for (const [subName, subItems] of Object.entries(categoryData)) {
          if (Array.isArray(subItems)) {
            for (const item of subItems) {
              items.push({
                id: `${categoryName}-${subName}-${item.value}`,
                category: categoryName as GraphCategory,
                value: item.value,
                metadata: { subcategory: subName, ...item }
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Error extracting items from XML:", error);
  }
  
  return items;
}
