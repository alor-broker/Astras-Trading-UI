import {
  Inject,
  Injectable
} from '@angular/core';
import { DOCUMENT } from "@angular/common";
import {
  fromEvent,
  map,
  Observable,
  share,
  switchMap,
} from "rxjs";
import { TerminalSettingsService } from "../../modules/terminal-settings/services/terminal-settings.service";
import { filter } from "rxjs/operators";
import { HotKeysSettings } from "../models/terminal-settings/terminal-settings.model";
import { TerminalCommand } from "../models/terminal-command";

@Injectable({ providedIn: 'root' })
export class HotKeyCommandService {
  public readonly commands$: Observable<TerminalCommand>;

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly terminalSettingsService: TerminalSettingsService,
  ) {
    this.commands$ = terminalSettingsService.getSettings().pipe(
      map(x => x.hotKeysSettings),
      filter((x): x is HotKeysSettings => !!x),
      switchMap((hotKeysSettings: { [key: string]: any | undefined | null }) => {
        const hotKeyMap = new Map<string, string>();
        Object.keys(hotKeysSettings).forEach(command => {
          const key = hotKeysSettings[command] as any | undefined | null;
          if (!!key && (typeof key === 'string' || key instanceof String)) {
            hotKeyMap.set(key.toString(), HotKeyCommandService.mapToCommandType(command));
          }
        });

        return fromEvent<KeyboardEvent>(this.document, 'keydown').pipe(
          filter(x => {
              const target = (x.target as HTMLElement);
              return target?.tagName === 'BODY';
            }
          ),
          map(x => {
            let mappedCommand = hotKeyMap.get(x.key);
            if (mappedCommand != null) {
              return mappedCommand;
            }

            return x.key;
          })
        );
      }),
      map(commandType => ({ type: commandType } as TerminalCommand)),
      share()
    );
  }

  private static mapToCommandType(settingCode: string): string {
    switch (settingCode) {
      case 'cancelOrdersKey':
        return 'cancelLimitOrdersAll';
      case 'closePositionsKey':
        return 'closePositionsByMarketAll';
      case 'centerOrderbookKey':
        return 'centerOrderbook';
      case 'cancelOrderbookOrders':
        return 'cancelLimitOrdersCurrent';
      case 'closeOrderbookPositions':
        return 'closePositionsByMarketCurrent';
      case 'reverseOrderbookPositions':
        return 'reversePositionsByMarketCurrent';
      default:
        return settingCode;
    }
  }
}
