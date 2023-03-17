import { TestBed } from '@angular/core/testing';

import { TreemapService } from './treemap.service';
import { HttpClientTestingModule } from "@angular/common/http/testing";

describe('TreemapService', () => {
  let service: TreemapService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(TreemapService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
