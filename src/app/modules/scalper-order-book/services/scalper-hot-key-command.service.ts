import { Injectable, DOCUMENT, inject } from '@angular/core';

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
import {
  ModifierKeys,
  ScalperCommand
} from "../models/scalper-command";
import { TerminalSettingsService } from "../../../shared/services/terminal-settings.service";
import {
  HotKeyMeta,
  HotKeysSettings
} from "../../../shared/models/terminal-settings/terminal-settings.model";

@Injectable({ providedIn: 'root' })
export class ScalperHotKeyCommandService {
  private readonly document = inject<Document>(DOCUMENT);
  private readonly terminalSettingsService = inject(TerminalSettingsService);

  public readonly commands$: Observable<ScalperCommand>;
  public readonly modifiers$: Observable<ModifierKeys>;
  private readonly inputs = ['INPUT', 'TEXTAREA'];

  constructor() {
    this.commands$ = this.getCommandsStream();
    this.modifiers$ = this.getModifierKeysStream();
  }

  private getCommandsStream(): Observable<ScalperCommand> {
    return this.terminalSettingsService.getSettings().pipe(
      map(x => x.hotKeysSettings),
      filter((x): x is HotKeysSettings => !!x),
      switchMap((hotKeysSettings: HotKeysSettings) => {
        const hotKeyMap = new Map<string | HotKeyMeta, { commandType: string, index?: number }>();
        Object.keys(hotKeysSettings).forEach(command => {
          const key = hotKeysSettings[command as keyof HotKeysSettings] as HotKeyMeta | string | string[] | undefined | null;

          if (key != null) {
            if (typeof key === 'string' || key instanceof String) {
              hotKeyMap.set(
                key.toString(),
                { commandType: command }
              );

              return;
            }

            if ((key as HotKeyMeta).code && (key as HotKeyMeta).key) {
              hotKeyMap.set(
                key as HotKeyMeta,
                { commandType: command }
              );
            }

            if (Array.isArray(key)) {
              [...key].forEach((value, index) => {
                hotKeyMap.set(
                  value.toString(),
                  {
                    commandType: command,
                    index
                  }
                );
              });
              return;
            }
          }
        });

        return fromEvent<KeyboardEvent>(this.document.body, 'keydown').pipe(
          filter(x => !this.isUserInputTarget(x.target as HTMLElement)),
          tap(x => {
            if (x.code === 'Space') {
              x.preventDefault();
            }
          }),
          filter(x => !x.repeat),
          map(x => {
            let mappedCommand = null as { commandType: string, index?: number } | null | undefined;

            hotKeyMap.forEach((value, key) => {
              if (typeof key === 'string' && key === x.key) {
                mappedCommand = value;
                return;
              }

              const keyMeta = key as HotKeyMeta;

              if (keyMeta.key && keyMeta.code) {
                if (hotKeysSettings.extraHotKeys ?? false) {
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
              } as ScalperCommand;
            }

            return {
              key: x.key,
              type: x.key
            } as ScalperCommand;
          })
        );
      }),
      share()
    );
  }

  private isUserInputTarget(target?: HTMLElement): boolean {
    return this.inputs.find(x => x === target?.tagName) != null;
  }

  private getModifierKeysStream(): Observable<{ shiftKey: boolean, ctrlKey: boolean, altKey: boolean }> {
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

    if (keyMeta.altKey ?? false) {
      result = pressedKey.altKey;
    }

    if (keyMeta.shiftKey ?? false) {
      result = result && pressedKey.shiftKey;
    }

    if (keyMeta.ctrlKey ?? false) {
      result = result && (pressedKey.ctrlKey || pressedKey.metaKey);
    }

    return result;
  }
}
