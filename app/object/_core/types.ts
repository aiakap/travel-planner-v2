/**
 * Core types for the object-based chat system
 * Minimal dependencies - only React types
 */

import { ReactNode, ComponentType } from "react";

/**
 * Message in the chat
 */
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  cards?: MessageCard[];
}

/**
 * Card displayed in a message
 */
export interface MessageCard {
  id: string;
  type: string;
  data: any;
  component?: ComponentType<any>;
}

/**
 * Props for card components
 */
export interface CardProps<T = any> {
  data: T;
  onAction?: (action: string, data: any) => void;
  onDataUpdate?: (newData: any) => void;
}

/**
 * Panel state for resizing and collapsing
 */
export interface PanelState {
  leftWidth: number;
  isLeftCollapsed: boolean;
  isRightCollapsed: boolean;
}

/**
 * Chat panel props
 */
export interface ChatPanelProps {
  config: any; // Will be typed properly in config types
  userId: string;
  params?: Record<string, string>;
  onDataUpdate: (data: any) => void;
}

/**
 * Data panel props
 */
export interface DataPanelProps {
  config: any; // Will be typed properly in config types
  data: any;
  params?: Record<string, string>;
}

/**
 * Resizable divider props
 */
export interface ResizableDividerProps {
  onResize: (width: number) => void;
}

/**
 * Chat layout props
 */
export interface ChatLayoutProps {
  config: any; // Will be typed properly in config types
  userId: string;
  initialData: any;
  params?: Record<string, string>;
}
