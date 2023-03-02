import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkIndicatorComponent } from './network-indicator.component';
import { NetworkStatusService } from '../../services/network-status.service';
import { BehaviorSubject } from 'rxjs';
import { NetworkStatus } from '../../models/enums/network-status.model';
import {
  getTranslocoModule,
  ngZorroMockComponents
} from '../../utils/testing';

describe('NetworkIndicatorComponent', () => {
  let component: NetworkIndicatorComponent;
  let fixture: ComponentFixture<NetworkIndicatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports:[getTranslocoModule()],
      declarations: [
        NetworkIndicatorComponent,
        ...ngZorroMockComponents
      ],
      providers: [
        {
          provide: NetworkStatusService,
          useValue: {
            status$: new BehaviorSubject(NetworkStatus.Online)
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NetworkIndicatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
