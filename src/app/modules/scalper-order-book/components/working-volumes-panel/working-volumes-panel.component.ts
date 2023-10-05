import {
  Component, DestroyRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  BehaviorSubject,
  filter,
  Observable,
  shareReplay,
  take,
  withLatestFrom
} from 'rxjs';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { map } from 'rxjs/operators';
import { HotKeyCommandService } from '../../../../shared/services/hot-key-command.service';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import { ScalperSettingsHelper } from "../../utils/scalper-settings.helper";

@Component({
  selector: 'ats-working-volumes-panel',
  templateUrl: './working-volumes-panel.component.html',
  styleUrls: ['./working-volumes-panel.component.less']
})
export class WorkingVolumesPanelComponent implements OnInit, OnDestroy {
  @Input()
  isActive: boolean = false;
  @Input({required: true})
  guid!: string;
  workingVolumes$!: Observable<number[]>;
  readonly selectedVolume$ = new BehaviorSubject<{ index: number, value: number } | null>(null);
  @Output()
  selectedVolumeChanged = new EventEmitter<number>();
  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly hotKeyCommandService: HotKeyCommandService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnInit(): void {
    this.workingVolumes$ = ScalperSettingsHelper.getSettingsStream(this.guid, this.widgetSettingsService).pipe(
      map(x => x.workingVolumes),
      shareReplay(1)
    );

    this.workingVolumes$.pipe(
      take(1),
      filter(x => x.length > 0)
    ).subscribe(x => {
      this.selectedVolume$.next({ index: 0, value: x[0] });
    });

    this.selectedVolume$.pipe(
      filter(x => !!x),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(x => {
      this.selectedVolumeChanged.emit(x!.value);
    });

    this.initVolumeSwitchByHotKey();
  }

  ngOnDestroy(): void {
    this.selectedVolume$.complete();
  }

  selectVolume(index: number, value: number) {
    this.selectedVolume$.next({
      index,
      value
    });
  }

  private initVolumeSwitchByHotKey() {
    this.hotKeyCommandService.commands$.pipe(
      filter(x => x.type === 'workingVolumes' && x.index != null && this.isActive),
      withLatestFrom(this.workingVolumes$),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(([command, workingVolumes]) => {
      const volume = workingVolumes[command.index];
      if (!!volume) {
        this.selectVolume(command.index, volume);
      }
    });
  }
}
