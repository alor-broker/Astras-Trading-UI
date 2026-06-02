export interface Event {
  key: string;
  payload?: unknown;
}

export interface StoredEvent extends Event {
  timestamp: number;
}

export interface SubscribeOptions {
  /**
   * Воспроизводит последнее опубликованное событие для каждого совпавшего ключа
   * позднему подписчику (семантика BehaviorSubject для событий-состояний).
   */
  replayLast?: boolean;
}
