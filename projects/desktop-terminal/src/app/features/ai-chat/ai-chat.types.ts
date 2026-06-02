export enum MessageType {
  Text = 'text'
}

export type MessageContent = object;

export interface Message<T extends MessageContent> {
  avatarUri?: string;
  date: Date;
  isMe: boolean;
  messageType: MessageType;
  content: T;
}

export interface TextMessageContent extends MessageContent {
  text: string;
}

export interface DisplayStatus {
  text: string;
}

export interface OutcomingMessage {
  text: string;
}
