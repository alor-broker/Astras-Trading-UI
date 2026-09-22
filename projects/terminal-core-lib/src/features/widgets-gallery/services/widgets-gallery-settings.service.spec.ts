import {TestBed} from '@angular/core/testing';
import {provideStore, provideState} from '@ngrx/store';
import {provideEffects} from '@ngrx/effects';
import {firstValueFrom, of, Subject} from 'rxjs';
import {ClientDashboardType, AdminDashboardType} from '../../dashboard/types/dashboard.types';
import {EntityStatus} from '../../../common/types/entity-status.types';
import {WIDGETS_GALLERY_STORAGE, WidgetsGallerySettings} from '../types/widgets-gallery-settings.types';
import {WidgetsGalleryFeature} from '../store/widgets-gallery.store';
import {WidgetsGalleryEffects} from '../store/widgets-gallery.effects';
import {WidgetsGallerySettingsHelper} from '../utils/widgets-gallery-settings.helper';
import {WidgetsGallerySettingsService} from './widgets-gallery-settings.service';

describe('WidgetsGallerySettingsService', () => {
  let service: WidgetsGallerySettingsService;
  let storage: {read: ReturnType<typeof vi.fn>, save: ReturnType<typeof vi.fn>};

  beforeEach(() => {
    storage = {read: vi.fn(() => of(WidgetsGallerySettingsHelper.empty())), save: vi.fn(() => of(true))};
    TestBed.configureTestingModule({providers: [provideStore(), provideState(WidgetsGalleryFeature), provideEffects(WidgetsGalleryEffects),
      WidgetsGallerySettingsService, {provide: WIDGETS_GALLERY_STORAGE, useValue: storage}]});
    service = TestBed.inject(WidgetsGallerySettingsService);
  });

  it('should block writes after a failed read and allow retry', async () => {
    storage.read.mockReturnValueOnce(of(null));
    service.load();
    const preferences = WidgetsGallerySettingsHelper.preferences(WidgetsGallerySettingsHelper.empty(), ClientDashboardType.ClientDesktop);
    expect(service.state().status).toBe(EntityStatus.Failure);
    expect(await firstValueFrom(service.save(ClientDashboardType.ClientDesktop, preferences))).toBe(false);
    expect(storage.save).not.toHaveBeenCalled();
    service.load();
    expect(service.state().status).toBe(EntityStatus.Success);
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('should commit only successful saves, preserve other dashboards and allow retry', async () => {
    const previous: WidgetsGallerySettings = {dashboards: {
      [AdminDashboardType.AdminMain]: {favoriteWidgets: [{typeId: 'unknown'}], showOtherCategories: false, showFavoriteCategories: true}
    }};
    storage.read.mockReturnValue(of(previous));
    storage.save.mockReturnValueOnce(of(false)).mockReturnValueOnce(of(true));
    service.load();
    const preferences = {favoriteWidgets: [], showOtherCategories: true, showFavoriteCategories: false};
    expect(await firstValueFrom(service.save(ClientDashboardType.ClientDesktop, preferences))).toBe(false);
    expect(service.state().settings).toEqual(previous);
    expect(await firstValueFrom(service.save(ClientDashboardType.ClientDesktop, preferences))).toBe(true);
    expect(service.state().settings.dashboards).toEqual({...previous.dashboards, [ClientDashboardType.ClientDesktop]: preferences});
  });

  it('should prevent a second save while the first is pending', async () => {
    const result$ = new Subject<boolean>();
    storage.save.mockReturnValue(result$);
    service.load();
    const preferences = WidgetsGallerySettingsHelper.preferences(WidgetsGallerySettingsHelper.empty(), ClientDashboardType.ClientDesktop);
    const pending = firstValueFrom(service.save(ClientDashboardType.ClientDesktop, preferences));
    expect(service.state().saving).toBe(true);
    expect(await firstValueFrom(service.save(ClientDashboardType.ClientDesktop, preferences))).toBe(false);
    expect(storage.save).toHaveBeenCalledTimes(1);
    result$.next(true);
    result$.complete();
    expect(await pending).toBe(true);
    expect(service.state().saving).toBe(false);
  });
});
