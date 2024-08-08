export type CalendarEvents = Record<string, CalendarEvent>;

export interface CalendarEvent {
  dividendEvents: DividendEvent[] | null;
  bondEvents: BondEvent | null;
  date: Date;
}

interface BondEvent {
  amortizationEvents: AmortizationEvent[] | null;
  couponEvents: CouponEvent[] | null;
  offerEvents: OfferEvent[] | null;
}

interface DividendEvent {
  recordDate?: string;
  dividendPerShare: number;
  dividendYield: number;
  currency: string;
  symbol: string;
  exchange: string;
  shortName: string;
}

interface AmortizationEvent {
  parFraction: number;
  amount: number;
  currency: string;
  date?: string;
  symbol: string;
  exchange: string;
  shortName: string;
}

interface CouponEvent {
  accruedInterest: number;
  intervalInDays: number;
  couponType: string;
  amount: number;
  currency: string;
  date?: string;
  symbol: string;
  exchange: string;
  shortName: string;
}

interface OfferEvent {
  description: string;
  bondEventType: string;
  date?: string;
  symbol: string;
  exchange: string;
  shortName: string;
}
