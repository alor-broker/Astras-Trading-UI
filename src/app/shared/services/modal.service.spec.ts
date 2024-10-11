import { TestBed } from '@angular/core/testing';
import { ModalService } from './modal.service';
import { NzModalModule } from "ng-zorro-antd/modal";

describe('ModalService', () => {
  let service: ModalService;
  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NzModalModule],
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
