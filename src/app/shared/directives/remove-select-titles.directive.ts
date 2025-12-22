import {
  AfterViewInit,
  DestroyRef,
  Directive,
  input
} from '@angular/core';
import { NzSelectComponent } from "ng-zorro-antd/select";
import { Observable } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Directive({ selector: 'nz-select[atsRemoveSelectTitles]' })
export class RemoveSelectTitlesDirective implements AfterViewInit {
  readonly valueChanges = input<Observable<any>>();

  constructor(
    private readonly destroyRef: DestroyRef,
    private readonly elementRef: NzSelectComponent
  ) { }

  ngAfterViewInit(): void {
    this.elementRef.nzOpenChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(isOpen => this.selectOpenStateChange(isOpen));
    this.valueChanges()
      ?.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.removeNativeTitles());

    this.removeNativeTitles();
  }

  selectOpenStateChange(isOpen: boolean): void {
    if (isOpen) {
      setTimeout(
        () => {
          document.querySelectorAll('.ant-select-item-option')
            .forEach(option => option.removeAttribute('title'));
        },
        0
      );
    }
  }

  removeNativeTitles(): void {
    setTimeout(
      () => {
        this.elementRef.nzSelectTopControlComponentElement.nativeElement.querySelectorAll('.ant-select-selection-item[title]')
          ?.forEach((item: Element) => item.removeAttribute('title'));
      },
      0
    );
  }
}
