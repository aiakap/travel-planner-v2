/**
 * Topic Selection Logic
 * Intelligently selects the next topic to present to the user
 */

import { PROFILE_TOPICS, ProfileTopic, getTopicById } from "@/app/object/_configs/profile-topics";

export interface TopicHistory {
  coveredTopics: string[]; // Topic IDs that have been presented
  answeredTopics: string[]; // Topic IDs that user has answered
}

/**
 * Select the next topic to present
 * Prioritizes:
 * 1. Related topics from the last answered topic
 * 2. High-priority uncovered topics
 * 3. Random uncovered topic
 */
export function selectNextTopic(
  history: TopicHistory,
  lastAnsweredTopicId?: string
): ProfileTopic | null {
  const { coveredTopics, answeredTopics } = history;

  // Get all uncovered topics
  const uncoveredTopics = PROFILE_TOPICS.filter(
    topic => !coveredTopics.includes(topic.id)
  );

  if (uncoveredTopics.length === 0) {
    return null; // All topics covered
  }

  // Strategy 1: If we have a last answered topic, check for related topics
  if (lastAnsweredTopicId) {
    const lastTopic = getTopicById(lastAnsweredTopicId);
    if (lastTopic?.relatedTopics) {
      const relatedUncovered = uncoveredTopics.filter(topic =>
        lastTopic.relatedTopics!.includes(topic.id)
      );
      if (relatedUncovered.length > 0) {
        // Return the highest priority related topic
        return relatedUncovered.sort((a, b) => 
          (a.priority || 999) - (b.priority || 999)
        )[0];
      }
    }
  }

  // Strategy 2: Return highest priority uncovered topic
  const sortedByPriority = uncoveredTopics.sort((a, b) =>
    (a.priority || 999) - (b.priority || 999)
  );

  return sortedByPriority[0];
}

/**
 * Get topic completion percentage
 */
export function getTopicCompletionPercentage(answeredTopics: string[]): number {
  if (PROFILE_TOPICS.length === 0) return 0;
  return Math.round((answeredTopics.length / PROFILE_TOPICS.length) * 100);
}

/**
 * Get topics by category with completion status
 */
export function getTopicsByCategoryWithStatus(
  category: string,
  answeredTopics: string[]
): Array<ProfileTopic & { isAnswered: boolean }> {
  return PROFILE_TOPICS
    .filter(topic => topic.category === category)
    .map(topic => ({
      ...topic,
      isAnswered: answeredTopics.includes(topic.id),
    }));
}

/**
 * Serialize topic history for storage
 */
export function serializeTopicHistory(history: TopicHistory): string {
  return JSON.stringify(history);
}

/**
 * Deserialize topic history from storage
 */
export function deserializeTopicHistory(data: string): TopicHistory {
  try {
    return JSON.parse(data);
  } catch {
    return { coveredTopics: [], answeredTopics: [] };
  }
}
