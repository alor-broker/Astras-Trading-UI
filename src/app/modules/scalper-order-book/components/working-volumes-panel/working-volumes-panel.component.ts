import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  Observable,
  shareReplay,
  take,
  withLatestFrom
} from 'rxjs';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { map } from 'rxjs/operators';
import { HotKeyCommandService } from '../../../../shared/services/hot-key-command.service';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ScalperSettingsHelper } from "../../utils/scalper-settings.helper";
import { WidgetLocalStateService } from "../../../../shared/services/widget-local-state.service";
import { RecordContent } from "../../../../store/widgets-local-state/widgets-local-state.model";
import { isInstrumentEqual } from "../../../../shared/utils/settings-helper";
import { ScalperOrderBookWidgetSettings } from "../../models/scalper-order-book-settings.model";

interface SelectedWorkingVolumeState extends RecordContent {
  lastSelectedVolume?: {
    [key: string]: number
  };
}

@Component({
  selector: 'ats-working-volumes-panel',
  templateUrl: './working-volumes-panel.component.html',
  styleUrls: ['./working-volumes-panel.component.less']
})
export class WorkingVolumesPanelComponent implements OnInit, OnDestroy {
  @Input()
  isActive: boolean = false;
  @Input({ required: true })
  guid!: string;
  workingVolumes$!: Observable<number[]>;
  readonly selectedVolume$ = new BehaviorSubject<{ index: number, value: number } | null>(null);
  @Output()
  selectedVolumeChanged = new EventEmitter<number>();
  private readonly lastSelectedVolumeStateKey = 'last-selected-volume';
  private lastSelectedVolumeState$!: Observable<SelectedWorkingVolumeState | null>;
  private settings$!: Observable<ScalperOrderBookWidgetSettings>;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly hotKeyCommandService: HotKeyCommandService,
    private readonly widgetLocalStateService: WidgetLocalStateService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnInit(): void {
    this.settings$ = ScalperSettingsHelper.getSettingsStream(this.guid, this.widgetSettingsService).pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.workingVolumes$ = this.settings$.pipe(
      map(x => x.workingVolumes),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.lastSelectedVolumeState$ = this.widgetLocalStateService.getStateRecord<SelectedWorkingVolumeState>(
      this.guid,
      this.lastSelectedVolumeStateKey
    ).pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.settings$.pipe(
      distinctUntilChanged((prev, curr) => isInstrumentEqual(prev, curr)),
      withLatestFrom(this.lastSelectedVolumeState$)
    ).subscribe(([settings, lastSelectedVolumeState]) => {
      const workingVolumes = settings.workingVolumes;
      const lastSelectedVolume = lastSelectedVolumeState?.lastSelectedVolume?.[ScalperSettingsHelper.getInstrumentKey(settings)];

      if (!!lastSelectedVolume) {
        const targetVolumeIndex = workingVolumes.findIndex(v => v === lastSelectedVolume);
        if (targetVolumeIndex >= 0) {
          this.selectVolume(targetVolumeIndex);
          return;
        }
      }

      this.selectVolume(0);
    });

    this.selectedVolume$.pipe(
      filter(x => !!x),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(x => {
      this.selectedVolumeChanged.emit(x!.value);
      this.updateLastSelectedVolumeState(x!.value);
    });

    this.initVolumeSwitchByHotKey();
  }

  ngOnDestroy(): void {
    this.selectedVolume$.complete();
  }

  selectVolume(index: number) {
    this.workingVolumes$.pipe(
      take(1)
    ).subscribe(v => {
      this.selectedVolume$.next({ index, value: v[index] });

    });
  }

  private updateLastSelectedVolumeState(currentVolume: number) {
    combineLatest({
      settings: this.settings$,
      currentState: this.lastSelectedVolumeState$
    }).pipe(
      take(1)
    ).subscribe(x => {
      this.widgetLocalStateService.setStateRecord<SelectedWorkingVolumeState>(
        this.guid,
        this.lastSelectedVolumeStateKey,
        {
          lastSelectedVolume: {
            ...x.currentState?.lastSelectedVolume,
            [ScalperSettingsHelper.getInstrumentKey(x.settings)]: currentVolume
          }
        }
      );
    });
  }

  private initVolumeSwitchByHotKey() {
    this.hotKeyCommandService.commands$.pipe(
      filter(x => x.type === 'workingVolumes' && x.index != null && this.isActive),
      withLatestFrom(this.workingVolumes$),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(([command, workingVolumes]) => {
      const volume = workingVolumes[command.index];
      if (volume != null) {
        this.selectVolume(command.index);
      }
    });
  }
}
