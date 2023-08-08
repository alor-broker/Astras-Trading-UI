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
import {
  filter,
  startWith,
  tap
} from "rxjs/operators";
import { HotKeyMeta, HotKeysSettings } from "../models/terminal-settings/terminal-settings.model";
import { TerminalCommand } from "../models/terminal-command";
import { ModifierKeys } from "../models/modifier-keys.model";
import {TerminalSettingsService} from "./terminal-settings.service";

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
        const hotKeyMap = new Map<string | HotKeyMeta, { commandType: string, index?: number }>();
        Object.keys(hotKeysSettings).forEach(command => {
          const key = hotKeysSettings[command] as any | undefined | null;
          if (!!key && (typeof key === 'string' || key instanceof String)) {
            hotKeyMap.set(
              key.toString(),
              { commandType: HotKeyCommandService.mapToCommandType(command) }
            );

            return;
          }

          if (!!key && key.code && key.key) {
            hotKeyMap.set(
              key,
              { commandType: HotKeyCommandService.mapToCommandType(command) }
            );
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

            let mappedCommand: { commandType: string, index?: number } | null | undefined = null;

            hotKeyMap.forEach((value, key) => {
              if (typeof key === 'string' && key === x.key) {
                mappedCommand = value;
                return;
              }

              const keyMeta = key as HotKeyMeta;

              if (keyMeta.key && keyMeta.code) {
                if (hotKeysSettings.extraHotKeys) {
                  if (x.code === keyMeta.code && this.checkPressedModifierKeys(x, keyMeta)) {

                    mappedCommand = value;
                  }
                } else {
                  if (x.key === keyMeta.key && this.checkPressedModifierKeys(x, keyMeta)) {
                    mappedCommand = value;
                  }
                }
              }
            });


            if (mappedCommand != null) {
              return {
                key: x.key,
                type: (mappedCommand as { commandType: string, index?: number }).commandType,
                index: (mappedCommand as { commandType: string, index?: number }).index
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
    const keyDownStream$ = fromEvent<KeyboardEvent>(this.document.body, 'keydown').pipe(
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
    );

    const keyUpStream$ = fromEvent<KeyboardEvent>(this.document.body, 'keyup').pipe(
      filter((e: KeyboardEvent) => e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta'),
      map((e: KeyboardEvent) => ({
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey || e.metaKey,
        altKey: e.altKey,
      })),
    );

    const focusLostStream$ = fromEvent<KeyboardEvent>(window, 'blur').pipe(
      map(() => ({ shiftKey: false, ctrlKey: false, altKey: false }))
    );

    return merge(
      keyDownStream$,
      keyUpStream$,
      focusLostStream$
    ).pipe(
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
        startWith({ shiftKey: false, ctrlKey: false, altKey: false }),
        shareReplay(1)
      );
  }

  private checkPressedModifierKeys(pressedKey: KeyboardEvent, keyMeta: HotKeyMeta): boolean {
    let result = true;

    if (keyMeta.altKey) {
      result = result && pressedKey.altKey;
    }

    if (keyMeta.shiftKey) {
      result = result && pressedKey.shiftKey;
    }

    if (keyMeta.ctrlKey) {
      result = result && (pressedKey.ctrlKey || pressedKey.metaKey);

    }

    return result;
  }
}
