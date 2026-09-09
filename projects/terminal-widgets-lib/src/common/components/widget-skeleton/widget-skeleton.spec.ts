import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  output,
  viewChild,
  ViewEncapsulation
} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {BehaviorSubject} from 'rxjs';
import {DeviceService} from '@terminal-core-lib/common/services/device.service';
import {
  DeviceInfo,
  DeviceType
} from '@terminal-core-lib/common/services/device-service-types';
import {WidgetSkeleton} from './widget-skeleton';
import {WidgetSettingsPlaceholder} from './widget-settings-placeholder/widget-settings-placeholder';

@Component({
  selector: 'ats-widget-settings-placeholder',
  template: '<span>Placeholder</span>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
class WidgetSettingsPlaceholderStub {
}

@Component({
  selector: 'ats-lifecycle-probe',
  template: '<span>Content</span>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
class LifecycleProbe implements OnDestroy {
  readonly destroyed = output();

  ngOnDestroy(): void {
    this.destroyed.emit();
  }
}

@Component({
  imports: [
    LifecycleProbe,
    WidgetSkeleton
  ],
  template: `
    <ats-widget-skeleton
      [content]="contentRef"
      [header]="headerRef"
      [isBlockWidget]="false"
      [settingsEditorContent]="settingsEditorRef"
      [showPlaceholder]="true"
    >
      <ng-template #headerRef><span class="header">Header</span></ng-template>
      <ng-template #contentRef>
        <ats-lifecycle-probe (destroyed)="handleContentDestroyed()"/>
      </ng-template>
      <ng-template #settingsEditorRef><span class="settings">Settings</span></ng-template>
    </ats-widget-skeleton>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
class TestHost {
  readonly widgetSkeleton = viewChild.required(WidgetSkeleton);

  destroyCount = 0;

  handleContentDestroyed(): void {
    this.destroyCount++;
  }
}

describe('WidgetSkeleton', () => {
  let deviceInfo$: BehaviorSubject<DeviceInfo>;

  beforeEach(() => {
    deviceInfo$ = new BehaviorSubject<DeviceInfo>({
      isMobile: true,
      deviceType: DeviceType.Mobile,
      userAgent: ''
    });

    TestBed.configureTestingModule({
      providers: [
        {
          provide: DeviceService,
          useValue: {
            deviceInfo$
          }
        }
      ]
    });

    TestBed.overrideComponent(WidgetSkeleton, {
      remove: {imports: [WidgetSettingsPlaceholder]},
      add: {imports: [WidgetSettingsPlaceholderStub]}
    });
  });

  it('should own the lifecycle of regular content while keeping the header rendered', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.directive(LifecycleProbe))).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.header')).not.toBeNull();

    fixture.componentInstance.widgetSkeleton().toggleSettings();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.directive(LifecycleProbe))).toBeNull();
    expect(fixture.componentInstance.destroyCount).toBe(1);
    expect(fixture.nativeElement.querySelector('.header')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.settings')).not.toBeNull();

    fixture.componentInstance.widgetSkeleton().closeSettings();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.directive(LifecycleProbe))).not.toBeNull();
  });

  it('should replace desktop content with a placeholder while settings are open', () => {
    deviceInfo$.next({
      isMobile: false,
      deviceType: DeviceType.Desktop,
      userAgent: ''
    });
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();

    fixture.componentInstance.widgetSkeleton().toggleSettings();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.directive(LifecycleProbe))).toBeNull();
    expect(fixture.nativeElement.querySelector('ats-widget-settings-placeholder')).not.toBeNull();
  });
});
