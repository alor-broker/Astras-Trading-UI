export interface NewFeedback {
  feedbackCode: string;
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
