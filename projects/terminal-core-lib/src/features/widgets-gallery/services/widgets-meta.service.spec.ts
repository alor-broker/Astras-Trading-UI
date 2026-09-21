import {TestBed} from '@angular/core/testing';
import {Location} from '@angular/common';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {firstValueFrom} from 'rxjs';
import {ErrorHandlerService} from '../../errors-handler/error-handler.service';
import {WidgetsMetaService} from './widgets-meta.service';
import {WidgetCategory, WidgetMetaConfig} from './widgets-meta-service.types';

describe('WidgetsMetaService', () => {
  it('should convert JSON expiry to Date once and preserve null or missing expiry', async () => {
    TestBed.configureTestingModule({providers: [
      provideHttpClient(), provideHttpClientTesting(),
      {provide: Location, useValue: {prepareExternalUrl: (url: string): string => url}},
      {provide: ErrorHandlerService, useValue: {}}
    ]});
    const http = TestBed.inject(HttpTestingController);
    const service = TestBed.inject(WidgetsMetaService);
    const expiry = '2026-10-18T00:00:00Z';
    const widgets: WidgetMetaConfig[] = [expiry, null, undefined].map((newUntil, index) => ({
      typeId: String(index), widgetName: {default: 'Widget'}, category: WidgetCategory.Info, newUntil
    }));

    const pending = firstValueFrom(service.getWidgetsMeta());
    http.expectOne('/assets/widgets-meta-config.json').flush(widgets);
    const result = await pending;

    expect(result?.[0].newUntil).toEqual(new Date(expiry));
    expect(result?.[1].newUntil).toBeNull();
    expect(result?.[2].newUntil).toBeUndefined();
    expect(await firstValueFrom(service.getWidgetsMeta())).toBe(result);
    http.verify();
  });
});
