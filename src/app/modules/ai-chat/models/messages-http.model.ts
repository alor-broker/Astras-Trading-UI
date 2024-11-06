export interface NewMessageRequest {
  text: string;
  threadId: string;
}

export interface ReplyResponse {
  text: string;
}

export interface SuggestionsResponse {
  suggestions: string[];
}
