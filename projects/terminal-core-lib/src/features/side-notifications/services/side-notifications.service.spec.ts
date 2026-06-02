import {TestBed} from '@angular/core/testing';
import {NzNotificationService} from 'ng-zorro-antd/notification';
import {TerminalSettingsServiceMock} from '@testing-lib/angular/terminal-settings-service.mock';
import {SideNotificationsService} from './side-notifications.service';
import {
  CommonInstantNotificationType,
  InstantNotificationType
} from '@terminal-core-lib/features/terminal-settings/terminal-settings.types';

describe('SideNotificationsService', () => {
  let service: SideNotificationsService;
  let notificationSpy: {
    info: ReturnType<typeof vi.fn>;
    success: ReturnType<typeof vi.fn>;
    warning: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };

  const notificationType = CommonInstantNotificationType.Common;

  function setup(hiddenNotifications: InstantNotificationType[] = []): void {
    notificationSpy = {
      info: vi.fn().mockReturnValue({messageId: 'ref'}),
      success: vi.fn().mockReturnValue({messageId: 'ref'}),
      warning: vi.fn().mockReturnValue({messageId: 'ref'}),
      error: vi.fn().mockReturnValue({messageId: 'ref'}),
      remove: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        SideNotificationsService,
        TerminalSettingsServiceMock.create({instantNotificationsSettings: {hiddenNotifications}}).provider,
        {provide: NzNotificationService, useValue: notificationSpy}
      ]
    });

    service = TestBed.inject(SideNotificationsService);
  }

  it('should route an info notification to the notification service', () => {
    setup();

    service.showNotification(notificationType, 'info', 'Title', 'Content', {nzDuration: 1000});

    expect(notificationSpy.info).toHaveBeenCalledWith('Title', 'Content', {nzDuration: 1000});
  });

  it('should route by display type', () => {
    setup();

    service.showNotification(notificationType, 'error', 'Title', 'Content');

    expect(notificationSpy.error).toHaveBeenCalledTimes(1);
    expect(notificationSpy.info).not.toHaveBeenCalled();
  });

  it('should not show a notification whose type is hidden in settings', () => {
    setup([notificationType]);

    service.showNotification(notificationType, 'info', 'Title', 'Content');

    expect(notificationSpy.info).not.toHaveBeenCalled();
  });

  it('should invoke the callback with the created notification reference', () => {
    setup();
    const ref = {messageId: 'created'};
    notificationSpy.success.mockReturnValue(ref);
    const callback = vi.fn();

    service.showNotification(notificationType, 'success', 'Title', 'Content', undefined, callback);

    expect(callback).toHaveBeenCalledWith(ref);
  });

  it('should remove a notification by id', () => {
    setup();

    service.removeNotification('notification-1');

    expect(notificationSpy.remove).toHaveBeenCalledWith('notification-1');
  });
});
