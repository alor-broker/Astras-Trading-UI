export interface NewFeedback {
  code: string;
  description: string;
}

export interface SendFeedBackRequest {
  rate: number;
  comment: string;
  feedbackCode: string;
}

export interface SendFeedBackResponse {
  error?: string;
}

export interface FeedbackMeta {
  lastCheck?: number;
  lastUnansweredFeedback?: UnansweredFeedback
}

export interface UnansweredFeedback extends NewFeedback {
  isRead: boolean;
}
