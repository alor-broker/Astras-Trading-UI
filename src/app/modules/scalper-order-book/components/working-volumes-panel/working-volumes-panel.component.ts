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
  readonly selectedVolume$ = new BehaviorSubject<{ index: number, value: number } | null>(null);
  @Output()
  selectedVolumeChanged = new EventEmitter<number>();
  private readonly destroyable = new Destroyable();

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
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
      this.selectedVolume$.next({ index: 0, value: x[0] });
    });

    this.selectedVolume$.pipe(
      filter(x => !!x),
      takeUntil(this.destroyable)
    ).subscribe(x => {
      this.selectedVolumeChanged.emit(x!.value);
    });

    this.initVolumeSwitchByHotKey();
  }

  ngOnDestroy(): void {
    this.selectedVolume$.complete();
    this.destroyable.destroy();
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
      takeUntil(this.destroyable)
    ).subscribe(([command, workingVolumes]) => {
      const volume = workingVolumes[command.index];
      if (!!volume) {
        this.selectVolume(command.index, volume);
      }
    });
  }
}
