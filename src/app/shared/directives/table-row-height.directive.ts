import { AfterViewInit, DestroyRef, Directive, ElementRef } from '@angular/core';
import { TerminalSettingsService } from "../services/terminal-settings.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { map } from "rxjs/operators";
import { TableRowHeight } from "../models/enums/table-row-height";
import { distinctUntilChanged } from "rxjs";

@Directive({
  selector: '[atsTableRowHeight]',
  standalone: true
})
export class TableRowHeightDirective implements AfterViewInit {
  private readonly targetElement: HTMLElement;

  constructor(
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly el: ElementRef,
    private readonly destroyRef: DestroyRef
  ) {
    this.targetElement = this.el.nativeElement as HTMLElement;
  }

  ngAfterViewInit(): void {
    this.terminalSettingsService.getSettings()
      .pipe(
        distinctUntilChanged((prev, curr) => prev.tableRowHeight === curr.tableRowHeight),
        takeUntilDestroyed(this.destroyRef),
        map(s => s?.tableRowHeight ?? TableRowHeight.Medium),
      )
      .subscribe(h => {
        this.targetElement.classList.remove(TableRowHeight.Low, TableRowHeight.Medium, TableRowHeight.High);

        this.targetElement.classList.add(h);
      });
  }
}
