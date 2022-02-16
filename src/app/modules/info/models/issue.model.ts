export interface Issue {
  facevalue: number,
  currentFaceValue: number, // после аморта номинал меняется
  issueVol: number,  // объем выпуска, шт
  issueVal: number,  // объем выпуска в валюте issueVol * facevalue
  issueDate: Date, // дата выпуска
  maturityDate: Date,  // дата погашения
  marketVol: number, // объем в обращении может меняться при оффертах, шт
  marketVal: number,  // объем выпуска в валюте, может меняться при офертах и амортах. marketVol * currentFaceValue
  issuer: string, //"МСБ-Лизинг",
  currentYield: number, // 0.0646,
  yieldToCall: number, // 0.07,
  yieldToPut: number, // 0.06,
  callDate: Date, // 2022-10-12T00:00:00,
  putDate: Date, // 2022-10-10T00:00:00,
  yieldToMaturity: number, // 0.14,
  nearestOfferDate: Date, // 2022-10-13T00:00:00,
  nearestAmortization: {
      parFraction: number, // 0.047,
      amount: number, // 50,
      currency: string, // RUB,
      date: Date, // 2023-01-28T00:00:00
  },
  nearestCoupon: {
      accruedInterest: number, // 11.15,
      intervalInDays: number, // 91,
      couponType: number, // 0,
      amount: number, // 16.1,
      currency: string, // RUB,
      date: Date, // 2022-03-23T00:00:00
  }
}
