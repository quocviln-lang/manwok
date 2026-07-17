export type NotificationType = "CARD_ASSIGNED" | "COMMENT_ADDED" | "SYSTEM_ALERT" | "WORKSPACE_INVITE" | "BOARD_JOIN_REQUEST";

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  read: boolean;
  relatedId: string | null;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  checklistId: string;
  content: string;
  isCompleted: boolean;
  position: number;
}

export interface Checklist {
  id: string;
  cardId: string;
  title: string;
  position: number;
  items: ChecklistItem[];
}

export interface Attachment {
  id: string;
  cardId: string;
  url: string;
  name: string;
  type: string;
  createdAt: string;
}

export interface CommentReaction {
  id: string;
  commentId: string;
  userId: string;
  emoji: string;
}

export interface Activity {
  id: string;
  boardId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  entityTitle: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    avatar: string | null;
  };
}

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const getAuthToken = () => localStorage.getItem("manwok_token");
export const setAuthToken = (token: string) => localStorage.setItem("manwok_token", token);
export const removeAuthToken = () => localStorage.removeItem("manwok_token");

export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  // If body is NOT FormData, default to application/json
  if (options.body && !(options.body instanceof FormData)) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  } else if (!options.body) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
};
