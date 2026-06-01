import {
  AfterViewInit,
  DestroyRef,
  Directive,
  ElementRef,
  inject
} from '@angular/core';
import {TerminalSettingsService} from '../../features/terminal-settings/services/terminal-settings.service';
import {
  distinctUntilChanged,
  map
} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {TableRowHeight as TableRowHeightType} from '../../features/terminal-settings/terminal-settings.types';

@Directive({
  selector: '[atsTableRowHeight]',
})
export class TableRowHeight implements AfterViewInit {
  private readonly terminalSettingsService = inject(TerminalSettingsService);

  private readonly el = inject(ElementRef);

  private readonly destroyRef = inject(DestroyRef);

  private readonly targetElement: HTMLElement;

  constructor() {
    this.targetElement = this.el.nativeElement as HTMLElement;
  }

  ngAfterViewInit(): void {
    this.terminalSettingsService.getSettings()
      .pipe(
        distinctUntilChanged((prev, curr) => prev.tableRowHeight === curr.tableRowHeight),
        takeUntilDestroyed(this.destroyRef),
        map(s => s?.tableRowHeight ?? TableRowHeightType.Medium),
      )
      .subscribe(h => {
        this.targetElement.classList.remove(TableRowHeightType.Low, TableRowHeightType.Medium, TableRowHeightType.High);

        this.targetElement.classList.add(h);
      });
  }
}
