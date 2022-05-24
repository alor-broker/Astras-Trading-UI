import { TestBed } from '@angular/core/testing';
import { ModalService } from './modal.service';
import { sharedModuleImportForTests } from '../utils/testing';

describe('ModalService', () => {
  let service: ModalService;
  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...sharedModuleImportForTests],
      providers: [
        ModalService
      ]
    });

    service = TestBed.inject(ModalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
