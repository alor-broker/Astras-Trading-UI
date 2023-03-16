import { TestBed } from '@angular/core/testing';
import { ModalService } from './modal.service';
import {
  commonTestProviders,
  sharedModuleImportForTests
} from '../utils/testing';

describe('ModalService', () => {
  let service: ModalService;
  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...sharedModuleImportForTests],
      providers: [
        ModalService,
        ...commonTestProviders
      ]
    });

    service = TestBed.inject(ModalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
