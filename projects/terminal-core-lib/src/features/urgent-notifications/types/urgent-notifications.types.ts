export interface NotificationsResponse {
  active: boolean;
  cards: Notification[];
}

export interface Notification {
  id: number;
  visibility: {
    isAstras: boolean;
  };
  clientTypes: {
    isPhysWithoutIIS: boolean;
    isPhysWithIIS: boolean;
    isJur: boolean;
  };
  title: string | null;
  cardOrder: number | null;
  link: string | null;
  activeFrom?: Date | null;
  activeTo?: Date | null;
}
