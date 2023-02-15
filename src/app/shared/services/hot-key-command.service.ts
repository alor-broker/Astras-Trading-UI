import {
  Inject,
  Injectable
} from '@angular/core';
import { DOCUMENT } from "@angular/common";
import {
  distinctUntilChanged,
  fromEvent,
  map,
  merge,
  Observable,
  share,
  shareReplay,
  switchMap
} from "rxjs";
import { TerminalSettingsService } from "../../modules/terminal-settings/services/terminal-settings.service";
import {
  filter,
  startWith,
  tap
} from "rxjs/operators";
import { HotKeysSettings } from "../models/terminal-settings/terminal-settings.model";
import { TerminalCommand } from "../models/terminal-command";
import { ModifierKeys } from "../models/modifier-keys.model";

@Injectable({ providedIn: 'root' })
export class HotKeyCommandService {
  public readonly commands$: Observable<TerminalCommand>;
  public readonly modifiers$: Observable<ModifierKeys>;
  private readonly inputs = ['INPUT', 'TEXTAREA'];

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly terminalSettingsService: TerminalSettingsService,
  ) {
    this.commands$ = this.getCommandsStream();
    this.modifiers$ = this.getModifierKeysStream();
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

  private getCommandsStream() {
    return this.terminalSettingsService.getSettings().pipe(
      map(x => x.hotKeysSettings),
      filter((x): x is HotKeysSettings => !!x),
      switchMap((hotKeysSettings: { [key: string]: any | undefined | null }) => {
        const hotKeyMap = new Map<string, { commandType: string, index?: number }>();
        Object.keys(hotKeysSettings).forEach(command => {
          const key = hotKeysSettings[command] as any | undefined | null;
          if (!!key && (typeof key === 'string' || key instanceof String)) {
            hotKeyMap.set(
              key.toString(),
              { commandType: HotKeyCommandService.mapToCommandType(command) }
            );

            return;
          }

          if (!!key && Array.isArray(key)) {
            [...key].forEach((value, index) => {
              hotKeyMap.set(
                value.toString(),
                {
                  commandType: HotKeyCommandService.mapToCommandType(command),
                  index
                }
              );
            });
            return;
          }
        });

        return fromEvent<KeyboardEvent>(this.document.body, 'keydown').pipe(
          filter(x => !this.isUserInputTarget(x.target as HTMLElement)),
          map(x => {
            if (x.code === 'Space') {
              x.preventDefault();
            }

            let mappedCommand = hotKeyMap.get(x.key);
            if (mappedCommand != null) {
              return {
                key: x.key,
                type: mappedCommand.commandType,
                index: mappedCommand.index
              } as TerminalCommand;
            }

            return {
              key: x.key,
              type: x.key
            } as TerminalCommand;
          })
        );
      }),
      share()
    );
  }

  private isUserInputTarget(target: HTMLElement): boolean {
    return this.inputs.find(x => x === target?.tagName) != null;
  }

  private getModifierKeysStream() {
    return merge(
      fromEvent<KeyboardEvent>(this.document.body, 'keydown'),
      fromEvent<KeyboardEvent>(this.document.body, 'keyup')
    )
      .pipe(
        filter(e => !this.isUserInputTarget(e.target as HTMLElement)),
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
        startWith({ shiftKey: false, ctrlKey: false, altKey: false }),
        shareReplay(1)
      );
  }
}
