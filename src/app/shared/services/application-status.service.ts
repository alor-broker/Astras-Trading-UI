import {DestroyRef, inject, Injectable, OnDestroy} from '@angular/core';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {DeviceService} from "./device.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Injectable({
  providedIn: 'root',
})
export class ApplicationStatusService implements OnDestroy {
  private readonly isActiveSubject = new BehaviorSubject<boolean>(true);

  private readonly deviceService = inject(DeviceService);

  private readonly destroyRef = inject(DestroyRef);

  private tearDown: Subscription | null = null;

  constructor() {
    this.deviceService.deviceInfo$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(deviceInfo => {
      this.tearDown?.unsubscribe();
      if (deviceInfo.isMobile) {
        this.initListener();
      }
    });
  }

  get isActive(): boolean {
    return this.isActiveSubject.getValue();
  }

  get isActive$(): Observable<boolean> {
    return this.isActiveSubject.asObservable();
  }

  ngOnDestroy(): void {
    this.isActiveSubject.complete();
    this.tearDown?.unsubscribe();
  }

  private initListener(): void {
    const handler = () => {
      const isActive = !document.hidden;
      console.log('isActive', isActive);
      this.isActiveSubject.next(isActive);
    };

    document.addEventListener('visibilitychange', handler);
    this.tearDown = new Subscription(() => {
      document.removeEventListener('visibilitychange', handler);
    });
  }
}
