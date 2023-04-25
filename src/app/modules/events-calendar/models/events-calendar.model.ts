export interface CalendarEvents {
  [date: string]: CalendarEvent[]
}

export interface CalendarEvent {
  symbol: string;
  exchange: string;
  dividendEvent: DividendEvent | null;
  bondEvent: BondEvent | null;
  date?: Date;
}

interface BondEvent {
  amortizationEvent: AmortizationEvent | null;
  couponEvent: CouponEvent | null;
  offerEvent: OfferEvent | null;
}

interface DividendEvent {
  recordDate?: string;
  dividendPerShare: number;
  dividendYield: number;
  currency: string;
}

interface AmortizationEvent {
  parFraction: number;
  amount: number;
  currency: string;
  date?: string;
}

interface CouponEvent {
  accruedInterest: number;
  intervalInDays: number;
  couponType: string;
  amount: number;
  currency: string;
  date?: string;
}

interface OfferEvent {
  description: string;
  bondEventType: string;
  date?: string;
}
