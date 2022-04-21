import { Calendar } from "../models/calendar.model";
import { Dividend } from "../models/dividend.model";

export const description = JSON.parse(`{
  "description": "ВЭБ.РФ — российская государственная корпорация развития, государственный инвестиционный банк, финансирующий проекты развития экономики. Полное наименование — Государственная корпорация развития «ВЭБ.РФ». Функционирует на основании специального федерального закона.",
  "isin": "RU000A100BM7",
  "baseCurrency": "RUB",
  "securityType": "bond",
  "issuerRatings": null
}
`);

export const finance = JSON.parse(`{
  "marketCap": "6489123123",
  "currency": "RUB",
  "ebitda": 164234324,
  "costEstimate": {
      "priceToEarnings": 2.21,
      "pricePerShare": 5.34,
      "dilutedEarningsPerShare": 50.33
  },
  "profitability": {
      "returnOnEquity": 0.2101,
      "returnOnAssets": 0.0295,
      "debtPerEquity": 0.6273,
      "netProfitMargin": 0.3791
  },
  "dividends": {
      "payoutRation": 0.5794,
      "averageDividendFor5years": 0.0643,
      "lastDividendYield": 0.0649
  },
  "trading": {
      "closePrice": 250,
      "maxFor52Weeks": 257.05,
      "minFor52Weeks": 257.05,
      "averageTurnoverPerDay": 3232423423,
      "averageTurnoverPerMonth": 234234234234255,
      "beta": 1.49
  },
  "sales": {
      "year": [
          {
              "year": 2010,
              "value": 10000
          },
          {
              "year": 2011,
              "value": 5000
          }
      ],
      "quorter": [
          {
              "quorterNumber": 1,
              "year": 2010,
              "value": 10000
          },
          {
              "quorterNumber": 2,
              "year": 2011,
              "value": 5000
          }
      ]
  },
  "netIncome": {
      "year": [
          {
              "year": 2010,
              "value": 10000
          },
          {
              "year": 2011,
              "value": 5000
          }
      ],
      "quorter": [
          {
              "quorterNumber": 1,
              "year": 2010,
              "value": 10000
          },
          {
              "quorterNumber": 2,
              "year": 2011,
              "value": 5000
          }
      ]
  }
}
`);

export const bondIssue = JSON.parse(`{
  "currentYield": 0.0646,
  "yieldToCall": 0.07,
  "yieldToPut": 0.06,
  "callDate": "2022-10-12T00:00:00",
  "putDate": "2022-10-10T00:00:00",
  "yieldToMaturity": 0.14,
  "nearestOfferDate": "2022-10-13T00:00:00",
  "nearestAmortization": {
      "parFraction": 0.047,
      "amount": 50,
      "currency": "RUB",
      "date": "2023-01-28T00:00:00"
  },
  "nearestCoupon": {
      "accruedInterest": 11.15,
      "intervalInDays": 91,
      "couponType": 0,
      "amount": 16.1,
      "currency": "RUB",
      "date": "2022-03-23T00:00:00"
  }
}
`);

export const bondsCalendar : Calendar = JSON.parse(`{
  "amortization": [
      {
          "parFraction": 0,
          "amount": 1000.0,
          "currency": "RUB",
          "date": "2022-04-26T00:00:00"
      }
  ],
  "coupon": [
      {
          "accruedInterest": 0,
          "intervalInDays": 0,
          "couponType": 0,
          "amount": 43.23,
          "currency": "RUB",
          "date": "2022-04-26T00:00:00"
      }
  ],
  "offers": []
}
`);

export const dividends : Dividend[] = JSON.parse(`[
  {
      "recordDate": "2017-05-02T00:00:00",
      "dividendPerShare": 6.0,
      "dividendYeild": 0.0707,
      "currency": "RUB"
  },
  {
      "recordDate": "2018-05-14T00:00:00",
      "dividendPerShare": 12.0,
      "dividendYeild": 0,
      "currency": "RUB"
  },
  {
      "recordDate": "2019-04-29T00:00:00",
      "dividendPerShare": 16.0,
      "dividendYeild": 0,
      "currency": "RUB"
  },
  {
      "recordDate": "2020-08-31T00:00:00",
      "dividendPerShare": 18.70,
      "dividendYeild": 0,
      "currency": "RUB"
  },
  {
      "recordDate": "2021-03-30T00:00:00",
      "dividendPerShare": 18.70,
      "dividendYeild": 0,
      "currency": "RUB"
  }
]
`);
