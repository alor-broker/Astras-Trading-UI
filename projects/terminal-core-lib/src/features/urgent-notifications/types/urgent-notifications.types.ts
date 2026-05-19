export interface NotificationsResponse {
  active: boolean;
  cards: Notification[];
}

export interface Notification {
  id: number;
  title: string | null;
  cardOrder: number | null;
  link: string | null;
  activeFrom?: Date | null;
  activeTo?: Date | null;
}
