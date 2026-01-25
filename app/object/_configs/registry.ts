/**
 * Config registry
 * Import and register all configs here
 */

import { registerConfig } from "./loader";
import { newChatConfig } from "./new_chat.config";
import { profileAttributeConfig } from "./profile_attribute.config";
import { tripExplorerConfig } from "./trip_explorer.config";

// Register all configs
registerConfig(newChatConfig);
registerConfig(profileAttributeConfig);
registerConfig(tripExplorerConfig);

// Export for convenience
export { newChatConfig, profileAttributeConfig, tripExplorerConfig };
