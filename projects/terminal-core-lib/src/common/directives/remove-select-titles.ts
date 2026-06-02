import {
  AfterViewInit,
  DestroyRef,
  Directive,
  inject,
  input
} from '@angular/core';
import {NzSelectComponent} from 'ng-zorro-antd/select';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {Observable} from 'rxjs';

@Directive({selector: 'nz-select[atsRemoveSelectTitles]'})
export class RemoveSelectTitles implements AfterViewInit {
  readonly valueChanges = input<Observable<any>>();

  private readonly destroyRef = inject(DestroyRef);

  private readonly elementRef = inject(NzSelectComponent);

  ngAfterViewInit(): void {
    this.elementRef.nzOpenChange
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
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
