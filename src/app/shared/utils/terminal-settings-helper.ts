import {
  FontFamilies,
  GridType,
  HotKeysSettings,
  InstantNotificationsSettings,
  MouseActionsSchemes,
  ScalperOrderBookMouseAction,
  ScalperOrderBookMouseActionsMap,
  TerminalSettings
} from '../models/terminal-settings/terminal-settings.model';
import { ThemeType } from '../models/settings/theme-settings.model';
import { TimezoneDisplayOption } from '../models/enums/timezone-display-option';
import { TableRowHeight } from "../models/enums/table-row-height";
import { instrumentsBadges } from "./instruments";

export class TerminalSettingsHelper {
  static getDefaultSettings(): TerminalSettings {
    return {
      timezoneDisplayOption: TimezoneDisplayOption.MskTime,
      isLogoutOnUserIdle: false,
      userIdleDurationMin: 15,
      badgesBind: false,
      badgesColors: instrumentsBadges,
      tableRowHeight: TableRowHeight.Medium,
      hotKeysSettings: this.getDefaultHotkeys(),
      scalperOrderBookMouseActions: this.getScalperOrderBookMouseActionsScheme1(),
      designSettings: {
        theme: ThemeType.dark,
        fontFamily: FontFamilies.NotoSans,
        gridType: GridType.Fit
      },
      instantNotificationsSettings: this.getDefaultInstantNotificationsSettings()
    } as TerminalSettings;
  }

  static getDefaultHotkeys(): HotKeysSettings {
    return {
      cancelOrdersKey: {
        key: '~',
        code: 'Backquote',
        shiftKey: true
      },
      closePositionsKey: {
        key: 'Delete',
        code: 'Delete'
      },
      centerOrderbookKey: {
        key: ' ',
        code: 'Space'
      },
      cancelOrderbookOrders: {
        key: 'e',
        code: 'KeyE',
      },
      cancelStopOrdersCurrent: {
        key: 'f',
        code: 'KeyF',
      },
      closeOrderbookPositions: {
        key: 'r',
        code: 'KeyR',
      },
      reverseOrderbookPositions: {
        key: 't',
        code: 'KeyT',
      },
      buyMarket: {
        key: 's',
        code: 'KeyS',
      },
      sellMarket: {
        key: 'a',
        code: 'KeyA',
      },
      sellBestOrder: {
        key: 'w',
        code: 'KeyW',
      },
      buyBestOrder: {
        key: 'q',
        code: 'KeyQ',
      },
      sellBestBid: {
        key: 'z',
        code: 'KeyZ',
      },
      buyBestAsk: {
        key: 'x',
        code: 'KeyX',
      },
      increaseScale: {
        key: '+',
        code: 'NumpadAdd'
      },
      decreaseScale: {
        key: '-',
        code: 'NumpadSubtract'
      },
      toggleGrowingVolumeDisplay: {
        key: 'v',
        code: 'KeyV'
      },
      workingVolumes: ['1', '2', '3', '4'],
      extraHotKeys: true
    };
  }

  static getScalperOrderBookMouseActionsScheme1(): ScalperOrderBookMouseActionsMap {
    return {
      mapName: MouseActionsSchemes.Scheme1,
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
          action: ScalperOrderBookMouseAction.StopLimitBuyOrder
        },
        {
          button: 'left',
          orderBookRowType: 'bid',
          modifier: 'ctrl',
          action: ScalperOrderBookMouseAction.StopLimitSellOrder
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
      mapName:  MouseActionsSchemes.Scheme2,
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
          action: ScalperOrderBookMouseAction.StopLimitBuyOrder
        },
        {
          button: 'left',
          orderBookRowType: 'bid',
          modifier: 'ctrl',
          action: ScalperOrderBookMouseAction.StopLimitSellOrder
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
