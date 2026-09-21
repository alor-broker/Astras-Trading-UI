import {TestBed} from '@angular/core/testing';
import {firstValueFrom, of} from 'rxjs';
import {RemoteStorageService} from '@terminal-core-lib/features/remote-storage/remote-storage.service';
import {GetRecordResult, GetRecordStatus} from '@terminal-core-lib/features/remote-storage/remote-storage-service.types';
import {WidgetsGallerySettingsHelper} from '@terminal-core-lib/features/widgets-gallery/utils/widgets-gallery-settings.helper';
import {WidgetsGallerySettingsBrokerService} from './widgets-gallery-settings-broker.service';
import {ApplicationMetaService} from '@terminal-core-lib/features/application-meta/application-meta.service';
import {ClientDashboardType} from '@terminal-core-lib/features/dashboard/types/dashboard.types';

describe('WidgetsGallerySettingsBrokerService', () => {
  let service: WidgetsGallerySettingsBrokerService;
  let remote: {getRecord: ReturnType<typeof vi.fn>, setRecord: ReturnType<typeof vi.fn>};
  let applicationMeta: {getMeta: ReturnType<typeof vi.fn>};

  beforeEach(() => {
    remote = {getRecord: vi.fn(), setRecord: vi.fn()};
    applicationMeta = {getMeta: vi.fn().mockReturnValue(of({}))};
    TestBed.configureTestingModule({providers: [
      WidgetsGallerySettingsBrokerService,
      {provide: RemoteStorageService, useValue: remote},
      {provide: ApplicationMetaService, useValue: applicationMeta}
    ]});
    service = TestBed.inject(WidgetsGallerySettingsBrokerService);
  });

  it('should distinguish a missing record from a read error and never write defaults on read', async () => {
    remote.getRecord.mockReturnValueOnce(of({status: GetRecordStatus.NotFound, record: null} satisfies GetRecordResult))
      .mockReturnValueOnce(of({status: GetRecordStatus.Error, record: null} satisfies GetRecordResult));
    expect(await firstValueFrom(service.read())).toEqual(WidgetsGallerySettingsHelper.empty());
    expect(await firstValueFrom(service.read())).toBeNull();
    expect(remote.getRecord).toHaveBeenCalledWith('widgets-gallery-settings');
    expect(remote.setRecord).not.toHaveBeenCalled();
  });

  it('should reject invalid stored content', async () => {
    remote.getRecord.mockReturnValue(of({status: GetRecordStatus.Success, record: {key: 'widgets-gallery-settings', meta: {timestamp: 0}, value: {dashboards: null}}} satisfies GetRecordResult));
    expect(await firstValueFrom(service.read())).toBeNull();
  });

  it.each([
    {savedAt: 99, resetAt: 100, resets: true},
    {savedAt: 100, resetAt: 100, resets: false},
    {savedAt: 101, resetAt: 100, resets: false},
    {savedAt: 99, resetAt: undefined, resets: false}
  ])('should apply the terminal reset timestamp to gallery settings ($savedAt, $resetAt)', async ({savedAt, resetAt, resets}) => {
    const settings = WidgetsGallerySettingsHelper.empty();
    settings.dashboards[ClientDashboardType.ClientDesktop] = {
      favoriteWidgets: [], showOtherCategories: false, showFavoriteCategories: true
    };
    applicationMeta.getMeta.mockReturnValue(of({lastResetTimestamp: resetAt}));
    remote.getRecord.mockReturnValue(of({
      status: GetRecordStatus.Success,
      record: {key: 'widgets-gallery-settings', meta: {timestamp: savedAt}, value: settings}
    } satisfies GetRecordResult));

    const result = await firstValueFrom(service.read());

    expect(result).toEqual(resets ? WidgetsGallerySettingsHelper.empty() : settings);
    expect(applicationMeta.getMeta).toHaveBeenCalledOnce();
    expect(remote.setRecord).not.toHaveBeenCalled();
  });

  it('should preserve a read error after a terminal reset', async () => {
    applicationMeta.getMeta.mockReturnValue(of({lastResetTimestamp: 100}));
    remote.getRecord.mockReturnValue(of({status: GetRecordStatus.Error, record: null} satisfies GetRecordResult));

    expect(await firstValueFrom(service.read())).toBeNull();
    expect(remote.setRecord).not.toHaveBeenCalled();
  });

  it('should save with the existing remote record contract and propagate failure for retry', async () => {
    remote.setRecord.mockReturnValueOnce(of(false)).mockReturnValueOnce(of(true));
    const settings = WidgetsGallerySettingsHelper.empty();
    expect(await firstValueFrom(service.save(settings))).toBe(false);
    expect(await firstValueFrom(service.save(settings))).toBe(true);
    expect(remote.setRecord).toHaveBeenCalledWith({key: 'widgets-gallery-settings', meta: {timestamp: expect.any(Number)}, value: settings});
  });
});
