import { PrismaClient } from '../app/generated/prisma';

const prisma = new PrismaClient();

interface ParsedItem {
  value: string;
  category: string;
  subcategory: string;
  metadata?: Record<string, any>;
}

/**
 * Simple XML parser for server-side migration
 */
function parseXmlToItems(xmlString: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  
  if (!xmlString || xmlString.trim() === '') {
    return items;
  }
  
  // Remove XML declaration
  xmlString = xmlString.replace(/<\?xml[^?]*\?>/g, '');
  
  // Extract profile content
  const profileMatch = xmlString.match(/<profile>([\s\S]*)<\/profile>/);
  if (!profileMatch) return items;
  
  const content = profileMatch[1];
  
  // Parse each category
  const categoryRegex = /<([^>\/\s]+)>([\s\S]*?)<\/\1>/g;
  let categoryMatch;
  
  while ((categoryMatch = categoryRegex.exec(content)) !== null) {
    const categoryName = categoryMatch[1];
    const categoryContent = categoryMatch[2];
    
    // Parse subcategories
    const subcategoryRegex = /<([^>\/\s]+)>([\s\S]*?)<\/\1>/g;
    let subMatch;
    
    while ((subMatch = subcategoryRegex.exec(categoryContent)) !== null) {
      const subcategoryName = subMatch[1];
      const subContent = subMatch[2];
      
      // Parse items
      const itemRegex = /<item([^>]*)>([\s\S]*?)<\/item>/g;
      let itemMatch;
      
      while ((itemMatch = itemRegex.exec(subContent)) !== null) {
        const attributes = itemMatch[1];
        const value = itemMatch[2].trim();
        
        const metadata: Record<string, any> = {};
        
        // Parse attributes
        const attrRegex = /(\w+)="([^"]*)"/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(attributes)) !== null) {
          metadata[attrMatch[1]] = attrMatch[2];
        }
        
        items.push({
          value,
          category: categoryName,
          subcategory: subcategoryName,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined
        });
      }
    }
  }
  
  return items;
}

/**
 * Map old category names to new slugs
 */
function mapCategoryToSlug(category: string, subcategory: string): string | null {
  // Normalize category and subcategory names
  const cat = category.toLowerCase().trim();
  const sub = subcategory.toLowerCase().trim();
  
  // Map old category/subcategory combinations to new slugs
  const mappings: Record<string, string> = {
    // Travel Style
    'travel-style:solo-vs-group': 'group-preference',
    'travel-style:luxury-vs-budget': 'luxury-level',
    'travel-style:adventure-vs-relaxation': 'adventure-level',
    'travel-style:pace': 'pace',
    
    // Destinations
    'destinations:regions': 'regions',
    'destinations:visited': 'visited',
    'destinations:wishlist': 'wishlist',
    'destinations:favorites': 'favorites',
    'destinations:countries': 'countries',
    'destinations:cities': 'cities',
    'destinations:climate': 'climate',
    'destinations:setting': 'setting',
    
    // Accommodations
    'accommodations:types': 'types',
    'accommodations:brands': 'brands',
    'accommodations:amenities': 'amenities',
    'accommodations:preference': 'types', // fallback
    
    // Transportation
    'transportation:airlines': 'airlines',
    'transportation:travel-class': 'travel-class',
    'transportation:loyalty-programs': 'loyalty-programs',
    'transportation:ground-transport': 'ground-transport',
    'transportation:preference': 'airlines', // fallback
    
    // Activities
    'activities:outdoor': 'outdoor',
    'activities:sports': 'sports',
    'activities:cultural': 'cultural',
    'activities:culinary': 'culinary-activities',
    'activities:wellness': 'wellness',
    'activities:adventure': 'adventure-activities',
    'activities:nightlife': 'nightlife',
    'activities:shopping': 'shopping',
    'activities:activity': 'outdoor', // fallback
    
    // Hobbies
    'hobbies:sports': 'sports',
    'hobbies:hobby': 'outdoor',
    'hobbies:culinary': 'cuisines',
    'hobbies:preference': 'outdoor', // fallback
    
    // Dining
    'dining:cuisines': 'cuisines',
    'dining:dietary': 'dietary',
    'dining:dining-style': 'dining-style',
    'dining:beverages': 'beverages',
    
    // Culinary Preferences (map to dining)
    'culinary-preferences:cuisines': 'cuisines',
    'culinary-preferences:dietary': 'dietary',
    'culinary-preferences:dining-style': 'dining-style',
    'culinary-preferences:beverages': 'beverages',
    
    // Travel Preferences
    'travel-preferences:airlines': 'airlines',
    'travel-preferences:hotels': 'brands',
    'travel-preferences:travel-class': 'travel-class',
    'travel-preferences:loyalty-programs': 'loyalty-programs',
    'travel-preferences:amenities': 'amenities',
    'travel-preferences:priorities': 'general',
    'travel-preferences:preference': 'general',
    
    // Budget
    'budget:daily-budget': 'daily-budget',
    'budget:splurge-categories': 'splurge-categories',
    'budget:savings-priorities': 'splurge-categories',
    'budget:loyalty-programs': 'loyalty-programs',
    'budget:credit-cards': 'credit-cards',
    
    // Companions
    'companions:solo': 'solo-companion',
    'companions:partner': 'partner',
    'companions:family': 'family-companion',
    'companions:friends': 'friends',
    'companions:organized-groups': 'organized-groups',
    'companions:special-needs': 'special-needs',
    
    // Travel Companions
    'travel-companions:family': 'family-companion',
    'travel-companions:solo': 'solo-companion',
    'travel-companions:partner': 'partner',
    'travel-companions:friends': 'friends',
    
    // Timing
    'timing:seasons': 'seasons',
    'timing:holidays': 'holidays',
    'timing:peak-vs-offpeak': 'peak-vs-offpeak',
    'timing:trip-length': 'trip-length',
    
    // Preferences (generic fallback)
    'preferences:preference': 'general',
    
    // Other
    'other:general': 'general'
  };
  
  const key = `${cat}:${sub}`;
  return mappings[key] || 'general'; // Default to 'general' if no mapping found
}

/**
 * Migrate a single user's XML data to relational format
 */
async function migrateUserData(userId: string, xmlData: string) {
  console.log(`  Migrating user ${userId}...`);
  
  const items = parseXmlToItems(xmlData);
  console.log(`    Found ${items.length} items in XML`);
  
  let migrated = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const item of items) {
    try {
      const categorySlug = mapCategoryToSlug(item.category, item.subcategory);
      
      if (!categorySlug) {
        console.log(`    ⚠️  No mapping for ${item.category}:${item.subcategory}`);
        skipped++;
        continue;
      }
      
      // Find the category
      const category = await prisma.profileCategory.findUnique({
        where: { slug: categorySlug }
      });
      
      if (!category) {
        console.log(`    ⚠️  Category not found: ${categorySlug}`);
        skipped++;
        continue;
      }
      
      // Find or create the profile value
      const profileValue = await prisma.profileValue.upsert({
        where: {
          value_categoryId: {
            value: item.value,
            categoryId: category.id
          }
        },
        create: {
          value: item.value,
          categoryId: category.id
        },
        update: {}
      });
      
      // Check if user already has this value
      const existing = await prisma.userProfileValue.findUnique({
        where: {
          userId_valueId: {
            userId,
            valueId: profileValue.id
          }
        }
      });
      
      if (existing) {
        skipped++;
        continue;
      }
      
      // Link value to user
      await prisma.userProfileValue.create({
        data: {
          userId,
          valueId: profileValue.id,
          metadata: {
            ...item.metadata,
            migratedFrom: 'xml',
            migratedAt: new Date().toISOString(),
            originalCategory: item.category,
            originalSubcategory: item.subcategory
          }
        }
      });
      
      migrated++;
    } catch (error: any) {
      console.error(`    ❌ Error migrating item "${item.value}":`, error.message);
      errors++;
    }
  }
  
  console.log(`    ✅ Migrated: ${migrated}, Skipped: ${skipped}, Errors: ${errors}`);
  
  return { migrated, skipped, errors };
}

/**
 * Main migration function
 */
async function migrateAllUsers() {
  console.log('🔄 Starting XML to Relational migration...\n');
  
  try {
    // Get all users with profile graph data
    const users = await prisma.userProfileGraph.findMany({
      where: {
        graphData: {
          not: null
        }
      }
    });
    
    console.log(`Found ${users.length} users with profile data\n`);
    
    let totalMigrated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    
    for (const user of users) {
      if (!user.graphData) continue;
      
      const result = await migrateUserData(user.userId, user.graphData);
      totalMigrated += result.migrated;
      totalSkipped += result.skipped;
      totalErrors += result.errors;
    }
    
    console.log('\n✅ Migration complete!');
    console.log(`   Total migrated: ${totalMigrated}`);
    console.log(`   Total skipped: ${totalSkipped}`);
    console.log(`   Total errors: ${totalErrors}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateAllUsers();
