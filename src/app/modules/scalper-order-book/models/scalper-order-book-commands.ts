export enum ScalperOrderBookCommands {
  centerOrderBook = 'centerOrderbook',
  cancelLimitOrdersAll = 'cancelLimitOrdersAll',
  closePositionsByMarketAll = 'closePositionsByMarketAll',
  cancelLimitOrdersCurrent = 'cancelLimitOrdersCurrent',
  closePositionsByMarketCurrent = 'closePositionsByMarketCurrent',
  sellBestOrder = 'sellBestOrder',
  buyBestOrder = 'buyBestOrder',
  sellMarket = 'sellMarket',
  buyMarket = 'buyMarket',
  reversePositionsByMarketCurrent = 'reversePositionsByMarketCurrent',
  sellBestBid = 'sellBestBid',
  buyBestAsk = 'buyBestAsk',
}
