export interface BlotterSettings {
  title?: string,
  exchange: string,
  portfolio: string,
  linkToActive?: boolean,
  guid: string
}

export function isEqual(
  settings1: BlotterSettings,
  settings2: BlotterSettings
) {
  if (settings1 && settings2) {
    return (
      settings1.linkToActive == settings2.linkToActive &&
      settings1.exchange == settings2.exchange &&
      settings1.portfolio == settings2.portfolio
    );
  } else return false;
}
