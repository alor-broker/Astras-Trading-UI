import {
  provideHttpClient,
  withInterceptorsFromDi
} from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { InfoService } from './info.service';
import { ErrorHandlerService } from '../../../shared/services/handle-error/error-handler.service';
import { sharedModuleImportForTests } from '../../../shared/utils/testing';
import { WidgetSettingsService } from "../../../shared/services/widget-settings.service";
import { of } from "rxjs";
import { EnvironmentService } from "../../../shared/services/environment.service";
import { InstrumentsService } from "../../instruments/services/instruments.service";

describe('InfoService', () => {
  let service: InfoService;
  const errorHandlerSpy = jasmine.createSpyObj('ErrorHandlerService', ['handleError']);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [...sharedModuleImportForTests],
    providers: [
        {
            provide: WidgetSettingsService,
            useValue: { getSettings: jasmine.createSpy('getSettings').and.returnValue(of({})) }
        },
        { provide: ErrorHandlerService, useValue: errorHandlerSpy },
        {
            provide: EnvironmentService,
            useValue: {
                apiUrl: ''
            }
        },
        InfoService,
        {
            provide: InstrumentsService,
            useValue: {
                getInstrument: jasmine.createSpy('getInstrument').and.returnValue(of(null))
            }
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
});
    service = TestBed.inject(InfoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
