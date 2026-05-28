import {
  ChangeDetectionStrategy,
  Component,
  inject,
  InjectionToken,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {Hook} from '@terminal-core-lib/common/types/hook.types';
import {TitleHook} from '@terminal-core-lib/common/hooks/set-title.hook';
import {SwEventsLoggingHook} from '@terminal-core-lib/features/pwa/hooks/sw-events-logging-hook';
import {SwUpdateHook} from '@terminal-core-lib/features/pwa/hooks/sw-update.hook';
import {CapacitorBodyClassHook} from './hooks/capacitor-body-class.hook';

const APP_INIT_HOOK = new InjectionToken<Hook[]>('APP_INIT_HOOK');

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: APP_INIT_HOOK,
      useClass: TitleHook,
      multi: true
    },
    {
      provide: APP_INIT_HOOK,
      useClass: SwUpdateHook,
      multi: true
    },
    {
      provide: APP_INIT_HOOK,
      useClass: SwEventsLoggingHook,
      multi: true
    },
    {
      provide: APP_INIT_HOOK,
      useClass: CapacitorBodyClassHook,
      multi: true
    },
  ],
})
export class App implements OnInit, OnDestroy {
  private readonly appInitHooks = inject(APP_INIT_HOOK, {optional: true});

  ngOnDestroy(): void {
    (this.appInitHooks ?? []).forEach(x => {
      x.onDestroy();
    });
  }

  ngOnInit(): void {
    (this.appInitHooks ?? []).forEach(x => {
      x.onInit();
    });
  }
}
