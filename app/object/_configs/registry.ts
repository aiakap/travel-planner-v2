/**
 * Config registry
 * Import and register all configs here
 */

import { registerConfig } from "./loader";
import { newChatConfig } from "./new_chat.config";
import { profileAttributeConfig } from "./profile_attribute.config";
import { tripExplorerConfig } from "./trip_explorer.config";
import { journeyArchitectConfig } from "./journey_architect.config";

// Register all configs
registerConfig(newChatConfig);
registerConfig(profileAttributeConfig);
registerConfig(tripExplorerConfig);
registerConfig(journeyArchitectConfig);

// Export for convenience
export { newChatConfig, profileAttributeConfig, tripExplorerConfig, journeyArchitectConfig };
