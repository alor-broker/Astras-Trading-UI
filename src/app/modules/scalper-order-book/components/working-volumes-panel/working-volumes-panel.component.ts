import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  BehaviorSubject,
  distinctUntilChanged,
  filter,
  Observable,
  shareReplay,
  take,
  takeUntil,
  withLatestFrom
} from 'rxjs';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { Destroyable } from '../../../../shared/utils/destroyable';
import { map } from 'rxjs/operators';
import { TerminalSettingsService } from '../../../terminal-settings/services/terminal-settings.service';
import { isArrayEqual } from '../../../../shared/utils/collections';
import { HotKeyCommandService } from '../../../../shared/services/hot-key-command.service';
import { ScalperOrderBookSettings } from '../../models/scalper-order-book-settings.model';

@Component({
  selector: 'ats-working-volumes-panel[guid][isActive]',
  templateUrl: './working-volumes-panel.component.html',
  styleUrls: ['./working-volumes-panel.component.less']
})
export class WorkingVolumesPanelComponent implements OnInit, OnDestroy {
  @Input()
  isActive: boolean = false;
  @Input() guid!: string;
  workingVolumes$!: Observable<number[]>;
  readonly selectedVolume$ = new BehaviorSubject<number | null>(null);
  @Output()
  selectedVolumeChanged = new EventEmitter<number>();
  private readonly destroyable = new Destroyable();

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly hotKeyCommandService: HotKeyCommandService
  ) {
  }

  ngOnInit(): void {
    this.workingVolumes$ = this.widgetSettingsService.getSettings<ScalperOrderBookSettings>(this.guid).pipe(
      map(x => x.workingVolumes),
      shareReplay()
    );

    this.workingVolumes$.pipe(
      take(1),
      filter(x => x.length > 0)
    ).subscribe(x => {
      this.selectedVolume$.next(x[0]);
    });

    this.selectedVolume$.pipe(
      filter(x => !!x),
      takeUntil(this.destroyable.destroyed$)
    ).subscribe(x => {
      this.selectedVolumeChanged.emit(x!);
    });

    this.initHotkeysVolumesSync();
    this.initVolumeSwitchByHotKey();
  }

  ngOnDestroy(): void {
    this.selectedVolume$.complete();
    this.destroyable.destroy();
  }

  selectVolume(value: number) {
    this.selectedVolume$.next(value);
  }

  private initHotkeysVolumesSync() {
    this.terminalSettingsService.getSettings().pipe(
      takeUntil(this.destroyable.destroyed$),
      distinctUntilChanged((prev, curr) =>
        isArrayEqual(
          prev?.hotKeysSettings?.workingVolumes ?? null,
          curr?.hotKeysSettings?.workingVolumes ?? null,
          (a, b) => a === b)),
      withLatestFrom(this.workingVolumes$),
    ).subscribe(([terminalSettings, workingVolumes]) => {
      this.widgetSettingsService.updateSettings(this.guid, {
        workingVolumes: terminalSettings.hotKeysSettings?.workingVolumes?.map((wv, i) => workingVolumes[i] || 10 ** i)
      });
    });
  }

  private initVolumeSwitchByHotKey() {
    this.hotKeyCommandService.commands$.pipe(
      filter(x => x.type === 'workingVolumes' && x.index != null && this.isActive),
      withLatestFrom(this.workingVolumes$),
      takeUntil(this.destroyable.destroyed$)
    ).subscribe(([command, workingVolumes]) => {
      const volume = workingVolumes[command.index];
      if (!!volume) {
        this.selectVolume(volume);
      }
    });
  }
}
