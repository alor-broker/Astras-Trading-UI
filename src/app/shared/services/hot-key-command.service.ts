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
  merge,
  distinctUntilChanged,
  shareReplay
} from "rxjs";
import { TerminalSettingsService } from "../../modules/terminal-settings/services/terminal-settings.service";
import { filter, tap } from "rxjs/operators";
import { HotKeysSettings } from "../models/terminal-settings/terminal-settings.model";
import { TerminalCommand } from "../models/terminal-command";
import { ModifierKeys } from "../models/modifier-keys.model";

@Injectable({ providedIn: 'root' })
export class HotKeyCommandService {
  private readonly inputs = ['INPUT', 'TEXTAREA'];

  public readonly commands$: Observable<TerminalCommand>;
  public readonly modifiers$: Observable<ModifierKeys>;

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly terminalSettingsService: TerminalSettingsService,
  ) {
    this.commands$ = this.getCommandsStream();
    this.modifiers$ = this.getModifierKeysStream();
  }

  private getCommandsStream() {
    return this.terminalSettingsService.getSettings().pipe(
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

        return fromEvent<KeyboardEvent>(this.document.body, 'keydown').pipe(
          filter(x => {
              const target = (x.target as HTMLElement);
              return this.inputs.find(x => x === target?.tagName) == null;
            }
          ),
          map(x => {
            if (x.code === 'Space') {
              x.preventDefault();
            }

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

  private getModifierKeysStream() {
    return merge(
      fromEvent<KeyboardEvent>(this.document.body, 'keydown'),
      fromEvent<KeyboardEvent>(this.document.body, 'keyup')
    )
      .pipe(
        filter(() => !this.document.querySelector('input:focus')),
        filter((e: KeyboardEvent) => e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta'),
        tap((e: KeyboardEvent) => {
          e.preventDefault();
          e.stopPropagation();
        }),
        map((e: KeyboardEvent) => ({
          shiftKey: e.shiftKey,
          ctrlKey: e.ctrlKey || e.metaKey,
          altKey: e.altKey,
        })),
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
        shareReplay(1)
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
