import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {firstValueFrom} from 'rxjs';
import {URGENT_NOTIFICATIONS_URL_PROVIDER} from '../../../config/api-url-providers';
import {ErrorHandlerService} from '../../errors-handler/error-handler.service';
import {ClientType} from '../../user-context/user.types';
import {Notification} from '../types/urgent-notifications.types';
import {UrgentNotificationsService} from './urgent-notifications.service';

describe('UrgentNotificationsService', () => {
  const url = '/cmsapi/v1/site/cards/ca_hotnews_banners';

  function createCard(id: number, audience: Partial<Notification['clientTypes']>, isAstras = true): Notification {
    return {
      id,
      title: null,
      cardOrder: null,
      link: null,
      visibility: {isAstras},
      clientTypes: {isPhysWithIIS: false, isPhysWithoutIIS: false, isJur: false, ...audience}
    };
  }

  const withIIS = createCard(1, {isPhysWithIIS: true});
  const withoutIIS = createCard(2, {isPhysWithoutIIS: true});
  const legalEntity = createCard(3, {isJur: true});
  const otherPlatform = createCard(4, {isPhysWithIIS: true, isJur: true}, false);
  const cards = [withIIS, withoutIIS, legalEntity, otherPlatform];
  const allAstrasIds = [withIIS.id, withoutIIS.id, legalEntity.id];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        UrgentNotificationsService,
        {provide: URGENT_NOTIFICATIONS_URL_PROVIDER, useValue: {urgentNotificationsUrl: url}},
        {provide: ErrorHandlerService, useValue: {handleError: vi.fn()}}
      ]
    });
  });

  it.each([
    {clientType: ClientType.Individual, expectedIds: [withIIS.id, withoutIIS.id]},
    {clientType: ClientType.LegalEntity, expectedIds: [legalEntity.id]},
    {clientType: ClientType.NotSpecified, expectedIds: allAstrasIds},
    {clientType: undefined, expectedIds: allAstrasIds}
  ])('should return the Astras banners for client type $clientType', async ({clientType, expectedIds}) => {
    const service = TestBed.inject(UrgentNotificationsService);
    const result = firstValueFrom(service.getNotifications(clientType));

    TestBed.inject(HttpTestingController).expectOne({method: 'GET', url}).flush({active: true, cards});

    expect((await result)?.cards.map(card => card.id)).toEqual(expectedIds);
  });
});
