import { TestBed } from '@angular/core/testing';
import { WidgetFactoryService } from './widget-factory.service';
import { sharedModuleImportForTests } from '../utils/testing';

describe('WidgetFactoryService', () => {
  let service: WidgetFactoryService;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...sharedModuleImportForTests],
      providers: [
        WidgetFactoryService
      ]
    });

    service = TestBed.inject(WidgetFactoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
