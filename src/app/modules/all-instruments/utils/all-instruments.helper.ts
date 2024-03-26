export const ALL_INSTRUMENTS_NESTED_FIELDS: { [fieldName: string]: string[] } = {
  basicInformation: ['symbol', 'shortName', 'exchange', 'market'],
  financialAttributes: ['tradingStatusInfo'],
  additionalInformation: ['cancellation', 'priceMultiplier'],
  boardInformation: ['board'],
  tradingDetails: ['lotSize', 'minStep', 'priceMax', 'priceMin', 'priceStep', 'rating'],
  currencyInformation: ['nominal'],
  realTimeData: ['dailyGrowth', 'dailyGrowthPercent', 'price', 'tradeVolume', 'yield']
};

export const ALL_INSTRUMENTS_FILTER_TYPES: { [fieldName: string]: string[] } = {
  search: ['symbol', 'shortName', 'board', 'nominal'],
  multiSelect: ['exchange', 'market'],
  interval: [
    'priceMultiplierFrom',
    'priceMultiplierTo',
    'lotSizeFrom',
    'lotSizeTo',
    'minStepFrom',
    'minStepTo',
    'priceMaxFrom',
    'priceMaxTo',
    'priceMinFrom',
    'priceMinTo',
    'priceStepFrom',
    'priceStepTo',
    'dailyGrowthFrom',
    'dailyGrowthTo',
    'dailyGrowthPercentFrom',
    'dailyGrowthPercentTo',
    'tradeVolumeFrom',
    'tradeVolumeTo',
    'priceFrom',
    'priceTo',
    'yieldFrom',
    'yieldTo'
  ],
  date: [
    'cancellationTo',
    'cancellationFrom',
  ]
};
