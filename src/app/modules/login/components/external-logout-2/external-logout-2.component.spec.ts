import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ExternalLogout2Component } from './external-logout-2.component';
import { LocalStorageService } from "../../../../shared/services/local-storage.service";

describe('ExternalLogout2Component', () => {
  let component: ExternalLogout2Component;
  let fixture: ComponentFixture<ExternalLogout2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExternalLogout2Component],
      providers: [
        {
          provide: LocalStorageService,
          useValue: {
            removeItem: jasmine.createSpy('removeItem').and.callThrough()
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ExternalLogout2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
