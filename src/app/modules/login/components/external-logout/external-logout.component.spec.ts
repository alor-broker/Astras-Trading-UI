import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ExternalLogoutComponent } from './external-logout.component';
import { BroadcastService } from '../../../../shared/services/broadcast.service';

describe('ExternalLogoutComponent', () => {
  let component: ExternalLogoutComponent;
  let fixture: ComponentFixture<ExternalLogoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExternalLogoutComponent],
      providers: [
        {
          provide: BroadcastService,
          useValue: {
            publish: jasmine.createSpy('publish').and.callThrough()
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ExternalLogoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
