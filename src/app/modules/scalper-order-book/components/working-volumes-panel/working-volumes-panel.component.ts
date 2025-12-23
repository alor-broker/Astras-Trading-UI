import { Component, DestroyRef, OnDestroy, OnInit, input, inject } from '@angular/core';
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
import { map } from 'rxjs/operators';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { WidgetLocalStateService } from "../../../../shared/services/widget-local-state.service";
import { RecordContent } from "../../../../store/widgets-local-state/widgets-local-state.model";
import { isInstrumentEqual } from "../../../../shared/utils/settings-helper";
import { ScalperOrderBookWidgetSettings } from "../../models/scalper-order-book-settings.model";
import { FormControl, Validators, FormsModule, ReactiveFormsModule } from "@angular/forms";
import {
  SCALPER_ORDERBOOK_SHARED_CONTEXT,
  ScalperOrderBookSharedContext
} from "../scalper-order-book/scalper-order-book.component";
import { inputNumberValidation } from "../../../../shared/utils/validation-options";
import { ScalperHotKeyCommandService } from "../../services/scalper-hot-key-command.service";
import { ScalperOrderBookSettingsWriteService } from "../../services/scalper-order-book-settings-write.service";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";
import { ScalperOrderBookDataContext } from "../../models/scalper-order-book-data-context.model";
import { LetDirective } from '@ngrx/component';
import { NzPopconfirmDirective } from 'ng-zorro-antd/popconfirm';
import { TranslocoDirective } from '@jsverse/transloco';
import { NzRowDirective, NzColDirective } from 'ng-zorro-antd/grid';
import { NzFormItemComponent, NzFormControlComponent, NzFormLabelComponent } from 'ng-zorro-antd/form';
import { InputNumberComponent } from '../../../../shared/components/input-number/input-number.component';

interface SelectedWorkingVolumeState extends RecordContent {
  lastSelectedVolume?: Record<string, number>;
}

@Component({
    selector: 'ats-working-volumes-panel',
    templateUrl: './working-volumes-panel.component.html',
    styleUrls: ['./working-volumes-panel.component.less'],
    imports: [
      LetDirective,
      NzPopconfirmDirective,
      TranslocoDirective,
      NzRowDirective,
      NzFormItemComponent,
      NzColDirective,
      NzFormControlComponent,
      NzFormLabelComponent,
      InputNumberComponent,
      FormsModule,
      ReactiveFormsModule
    ]
})
export class WorkingVolumesPanelComponent implements OnInit, OnDestroy {
  private readonly settingsWriteService = inject(ScalperOrderBookSettingsWriteService);
  private readonly hotKeyCommandService = inject(ScalperHotKeyCommandService);
  private readonly scalperOrderBookSharedContext = inject<ScalperOrderBookSharedContext>(SCALPER_ORDERBOOK_SHARED_CONTEXT, { skipSelf: true });
  private readonly widgetLocalStateService = inject(WidgetLocalStateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly validation = {
    volume: {
      min: 1,
      max: inputNumberValidation.max
    }
  };

  readonly isActive = input(false);

  readonly guid = input.required<string>();

  readonly orientation = input<'vertical' | 'horizontal'>('vertical');

  readonly dataContext = input.required<ScalperOrderBookDataContext>();

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

  ngOnInit(): void {
    this.settings$ = this.dataContext().extendedSettings$.pipe(
      map(x => x.widgetSettings),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.workingVolumes$ = this.settings$.pipe(
      map(x => x.workingVolumes),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.lastSelectedVolumeState$ = this.widgetLocalStateService.getStateRecord<SelectedWorkingVolumeState>(
      this.guid(),
      this.lastSelectedVolumeStateKey
    ).pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.settings$.pipe(
      distinctUntilChanged((prev, curr) => isInstrumentEqual(prev, curr)),
      withLatestFrom(this.lastSelectedVolumeState$)
    ).subscribe(([settings, lastSelectedVolumeState]) => {
      const workingVolumes = settings.workingVolumes;
      const lastSelectedVolume = lastSelectedVolumeState?.lastSelectedVolume?.[this.getSettingsInstrumentKey(settings)];

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
    this.initVolumeSwitchBySettingsChange();
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

        const newWorkingVolumes = s.workingVolumes
          .map((v, i) => i === index ? Number(this.changeVolumeControl.value) : v);

        this.settingsWriteService.updateInstrumentLinkedSettings(
          {
            workingVolumes: newWorkingVolumes
          },
          s
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
        this.guid(),
        this.lastSelectedVolumeStateKey,
        {
          lastSelectedVolume: {
            ...x.currentState?.lastSelectedVolume,
            [this.getSettingsInstrumentKey(x.settings)]: currentVolume
          }
        }
      );
    });
  }

  private initVolumeSwitchByHotKey(): void {
    this.hotKeyCommandService.commands$.pipe(
      filter(x => x.type === 'workingVolumes' && x.index != null && this.isActive()),
      withLatestFrom(this.workingVolumes$),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(([command, workingVolumes]) => {
      const volume = workingVolumes[command.index] as number | undefined;
      if (volume != null) {
        this.selectVolume(command.index);
      }
    });
  }

  private initVolumeSwitchBySettingsChange(): void {
    this.workingVolumes$.pipe(
      withLatestFrom(this.selectedVolume$),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(x => {
      const workingVolumes = x[0];
      const selectedVolume = x[1];

      if(selectedVolume === null || workingVolumes.length === 0) {
        return;
      }

      const volume = workingVolumes[selectedVolume.index] as number | undefined;
      if (volume != null) {
        this.selectVolume(selectedVolume.index);
      } else {
        this.selectVolume(0);
      }
    });
  }

  private getSettingsInstrumentKey(instrumentKey: InstrumentKey): string {
    return `${instrumentKey.exchange}:${instrumentKey.symbol}:${instrumentKey.instrumentGroup}`;
  }
}
