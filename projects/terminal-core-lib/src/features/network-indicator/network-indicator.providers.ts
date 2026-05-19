import {Provider} from '@angular/core';

export function provideNetworkIndicator(
  networkStatusProviders: Provider[],
  orderDelayProvider?: Provider
): Provider[] {
  const providers = [...networkStatusProviders];
  if (orderDelayProvider != null) {
    providers.push(orderDelayProvider);
  }
  return [
    ...providers
  ];
}
