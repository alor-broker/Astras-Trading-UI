import {
  HotKeysSettings,
  InstantNotificationsSettings,
  ScalperOrderBookMouseAction,
  ScalperOrderBookMouseActionsMap,
  TerminalSettings
} from '../models/terminal-settings/terminal-settings.model';
import { ThemeType } from '../models/settings/theme-settings.model';
import { TimezoneDisplayOption } from '../models/enums/timezone-display-option';

export class TerminalSettingsHelper {
  static getDefaultSettings(): TerminalSettings {
    return {
      timezoneDisplayOption: TimezoneDisplayOption.MskTime,
      userIdleDurationMin: 15,
      badgesBind: false,
      hotKeysSettings: this.getDefaultHotkeys(),
      scalperOrderBookMouseActions: this.getScalperOrderBookMouseActionsScheme1(),
      designSettings: {
        theme: ThemeType.dark
      },
      instantNotificationsSettings: this.getDefaultInstantNotificationsSettings()
    } as TerminalSettings;
  }

  static getDefaultHotkeys(): HotKeysSettings {
    return {
      cancelOrdersKey: '~',
      closePositionsKey: 'Escape',
      centerOrderbookKey: ' ',
      cancelOrderbookOrders: 'E',
      closeOrderbookPositions: 'R',
      reverseOrderbookPositions: 'T',
      buyMarket: 'S',
      sellMarket: 'A',
      workingVolumes: ['1', '2', '3', '4'],
      sellBestOrder: 'W',
      buyBestOrder: 'Q',
      sellBestBid: 'Z',
      buyBestAsk: 'X'
    };
  }

  static getScalperOrderBookMouseActionsScheme1(): ScalperOrderBookMouseActionsMap {
    return {
      mapName: 'scheme1',
      actions: [
        {
          button: 'left',
          orderBookRowType: 'ask',
          action: ScalperOrderBookMouseAction.LimitSellOrder
        },
        {
          button: 'left',
          orderBookRowType: 'bid',
          action: ScalperOrderBookMouseAction.LimitBuyOrder
        },
        {
          button: 'left',
          orderBookRowType: 'ask',
          modifier: 'ctrl',
          action: ScalperOrderBookMouseAction.StopLimitSellOrder
        },
        {
          button: 'left',
          orderBookRowType: 'bid',
          modifier: 'ctrl',
          action: ScalperOrderBookMouseAction.StopLimitBuyOrder
        },
        {
          button: 'left',
          orderBookRowType: 'any',
          modifier: 'shift',
          action: ScalperOrderBookMouseAction.StopLossOrder
        },
        {
          button: 'right',
          orderBookRowType: 'ask',
          action: ScalperOrderBookMouseAction.MarketBuyOrder
        },
        {
          button: 'right',
          orderBookRowType: 'bid',
          action: ScalperOrderBookMouseAction.MarketSellOrder
        },
      ]
    };
  }

  static getScalperOrderBookMouseActionsScheme2(): ScalperOrderBookMouseActionsMap {
    return {
      mapName: 'scheme2',
      actions: [
        {
          button: 'left',
          orderBookRowType: 'any',
          action: ScalperOrderBookMouseAction.LimitBuyOrder
        },
        {
          button: 'left',
          orderBookRowType: 'ask',
          modifier: 'ctrl',
          action: ScalperOrderBookMouseAction.StopLimitSellOrder
        },
        {
          button: 'left',
          orderBookRowType: 'bid',
          modifier: 'ctrl',
          action: ScalperOrderBookMouseAction.StopLimitBuyOrder
        },
        {
          button: 'left',
          orderBookRowType: 'any',
          modifier: 'shift',
          action: ScalperOrderBookMouseAction.StopLossOrder
        },
        {
          button: 'right',
          orderBookRowType: 'any',
          action: ScalperOrderBookMouseAction.LimitSellOrder
        },
      ]
    };
  }

  static getDefaultInstantNotificationsSettings(): InstantNotificationsSettings {
    return {
      hiddenNotifications: []
    };
  }
}
