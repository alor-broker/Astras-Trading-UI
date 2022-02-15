interface Amortization {
  date: Date, // 20.10.2021,
  amount: 127.42,
  currency: string, // RUB,
  parFraction: 0.127
}

interface Coupon {
  accruedInterest: number, // 0,
  intervalInDays: number, // 0,
  couponType: number, // 0,
  amount: number, // 43.23,
  currency: string, // "RUB",
  date: Date, // "2022-04-26T00:00:00"
}

interface Offer {
  date: Date, //  10.24.2010,
  type: string, // PUT or CALL,
  description: string, // Безотзывная оферта
}

interface Default {
  date: Date, // 10.15.2009,
  description: string, // Купонная выплата
}

export interface Calendar {
  amortizations: Amortization[],
  coupons: Coupon[],
  offers: Offer[],
  defaults: Default[]
}
