export const BOND_NESTED_FIELDS: { [fieldName: string]: string[] } = {
  basicInformation: ['symbol', 'shortName', 'exchange'],
  financialAttributes: ['tradingStatusInfo'],
  additionalInformation: ['cancellation', 'priceMultiplier'],
  boardInformation: ['board'],
  yield: ['currentYield'],
  tradingDetails: ['lotSize', 'minStep', 'priceMax', 'priceMin', 'priceStep', 'rating'],
  volumes: ['issueValue'],
  rootFields: ['couponRate', 'couponType', 'guaranteed', 'hasOffer', 'maturityDate', 'placementEndDate']
};

export const BOND_FILTER_TYPES: { [fieldName: string]: string[] } = {
  search: ['symbol', 'shortName', 'board'],
  multiSelect: ['exchange', 'couponType'],
  interval: [
    'priceMultiplierFrom',
    'priceMultiplierTo',
    'couponRateFrom',
    'couponRateTo',
    'currentYieldFrom',
    'currentYieldTo',
    'issueValueFrom',
    'issueValueTo',
    'lotSizeFrom',
    'lotSizeTo',
    'minStepFrom',
    'minStepTo',
    'priceMaxFrom',
    'priceMaxTo',
    'priceMinFrom',
    'priceMinTo',
    'priceStepFrom',
    'priceStepTo'
  ],
  bool: ['guaranteed', 'hasOffer'],
  date: [
    'cancellationTo',
    'cancellationFrom',
    'maturityDateTo',
    'maturityDateFrom',
    'placementEndDateTo',
    'placementEndDateFrom',
  ]
};
