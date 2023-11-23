export interface NotificationMeta {
  id: string;
  date: Date;
  title: string;
  description: string;
  isRead: boolean;
  showDate: boolean;
  open?(): void;
  markAsRead?() : void;
}
