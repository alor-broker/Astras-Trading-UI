export interface NewFeedback {
  code: string;
  description: string;
}

export interface SendFeedBackRequest {
  rating: number;
  comment: string;
  feedbackCode: string;
}

export interface SendFeedBackResponse {
  error?: string;
}

export interface FeedbackMeta {
  lastCheck?: number;
  lastUnansweredFeedback?: UnansweredFeedback | null;
}

export interface UnansweredFeedback extends NewFeedback {
  isRead: boolean;
  date?: number;
}
