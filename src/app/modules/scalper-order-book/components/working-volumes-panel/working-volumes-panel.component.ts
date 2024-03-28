import {
  Component,
  DestroyRef,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  SkipSelf
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
import {
  FormControl,
  Validators
} from "@angular/forms";
import {
  SCALPER_ORDERBOOK_SHARED_CONTEXT,
  ScalperOrderBookSharedContext
} from "../scalper-order-book/scalper-order-book.component";
import { inputNumberValidation } from "../../../../shared/utils/validation-options";

interface SelectedWorkingVolumeState extends RecordContent {
  lastSelectedVolume?: {
    [key: string]: number;
  };
}

@Component({
  selector: 'ats-working-volumes-panel',
  templateUrl: './working-volumes-panel.component.html',
  styleUrls: ['./working-volumes-panel.component.less']
})
export class WorkingVolumesPanelComponent implements OnInit, OnDestroy {
  readonly validation = {
    volume: {
      min: 1,
      max: inputNumberValidation.max
    }
  };
  @Input()
  isActive = false;
  @Input({ required: true })
  guid!: string;

  @Input()
  orientation: 'vertical' | 'horizontal' = 'vertical';

  workingVolumes$!: Observable<number[]>;
  readonly selectedVolume$ = new BehaviorSubject<{ index: number, value: number } | null>(null);
  changeVolumeConfirmVisibleIndex: null | number = null;
  changeVolumeControl = new FormControl(
    1,
    [
      Validators.required,
      Validators.min(this.validation.volume.min),
      Validators.max(this.validation.volume.max)
    ]
  );

  private readonly lastSelectedVolumeStateKey = 'last-selected-volume';
  private lastSelectedVolumeState$!: Observable<SelectedWorkingVolumeState | null>;
  private settings$!: Observable<ScalperOrderBookWidgetSettings>;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly hotKeyCommandService: HotKeyCommandService,
    @Inject(SCALPER_ORDERBOOK_SHARED_CONTEXT)
    @SkipSelf()
    private readonly scalperOrderBookSharedContext: ScalperOrderBookSharedContext,
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

      if (lastSelectedVolume != null && !!lastSelectedVolume) {
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
      this.scalperOrderBookSharedContext.setWorkingVolume(x!.value);
      this.updateLastSelectedVolumeState(x!.value);
    });

    this.initVolumeSwitchByHotKey();
  }

  ngOnDestroy(): void {
    this.selectedVolume$.complete();
  }

  selectVolume(index: number): void {
    this.workingVolumes$.pipe(
      take(1)
    ).subscribe(v => {
      this.selectedVolume$.next({ index, value: v[index] });
    });
  }

  applyVolumeChanges(index: number): void {
    this.settings$
      .pipe(
        take(1)
      )
      .subscribe(s => {
        if (!this.changeVolumeControl.valid) {
          this.closeVolumeChange();
          return;
        }

        const instrumentKey = ScalperSettingsHelper.getInstrumentKey(s);
        const newWorkingVolumes = (s.instrumentLinkedSettings?.[instrumentKey] ?? s).workingVolumes
          .map((v, i) => i === index ? Number(this.changeVolumeControl.value) : v);

        this.widgetSettingsService.updateSettings(
          this.guid,
          {
            instrumentLinkedSettings: {
              ...s.instrumentLinkedSettings,
              [instrumentKey]: {
                ...(s.instrumentLinkedSettings?.[instrumentKey] ?? {}),
                workingVolumes: newWorkingVolumes
              }
            }
          }
        );
        this.selectedVolume$.next({ index, value: this.changeVolumeControl.value! });
        this.closeVolumeChange();
      });
  }

  openVolumeChange(i: number, currentVolume: number): void {
    this.changeVolumeControl.reset();
    this.changeVolumeControl.setValue(currentVolume);
    this.changeVolumeConfirmVisibleIndex = i;
  }

  closeVolumeChange(): void {
    this.changeVolumeConfirmVisibleIndex = null;
  }

  volumeChangeVisibilityChanged(isOpened: boolean): void {
    if(!isOpened) {
      // when Esc button is pressed closeVolumeChange is not called and confirm for the same volume item cannot be opened again
      this.closeVolumeChange();
    }
  }

  private updateLastSelectedVolumeState(currentVolume: number): void {
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

  private initVolumeSwitchByHotKey(): void {
    this.hotKeyCommandService.commands$.pipe(
      filter(x => x.type === 'workingVolumes' && x.index != null && this.isActive),
      withLatestFrom(this.workingVolumes$),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(([command, workingVolumes]) => {
      const volume = workingVolumes[command.index] as number | undefined;
      if (volume != null) {
        this.selectVolume(command.index);
      }
    });
  }
}
