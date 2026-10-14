export interface NewMessageRequest {
  text: string;
  threadId: string;
}

export interface ReplyResponse {
  text: string;
}

export enum AiChatErrorCode {
  ContextTooLarge = 'context_too_large',
  ContextCompactionFailed = 'context_compaction_failed'
}

export interface MessageErrorResponse {
  errorCode: AiChatErrorCode;
}
