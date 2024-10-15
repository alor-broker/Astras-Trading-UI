import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { NetworkIndicatorComponent } from './network-indicator.component';
import { NetworkStatusService } from '../../../../shared/services/network-status.service';
import { BehaviorSubject, } from 'rxjs';
import { NetworkStatus } from '../../../../shared/models/enums/network-status.model';
import { LetDirective } from "@ngrx/component";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { ngZorroMockComponents } from "../../../../shared/utils/testing/ng-zorro-component-mocks";

describe('NetworkIndicatorComponent', () => {
  let component: NetworkIndicatorComponent;
  let fixture: ComponentFixture<NetworkIndicatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        LetDirective
      ],
      declarations: [
        NetworkIndicatorComponent,
        ...ngZorroMockComponents
      ],
      providers: [
        {
          provide: NetworkStatusService,
          useValue: {
            status$: new BehaviorSubject(NetworkStatus.Online),
            lastOrderDelayMSec$: new BehaviorSubject(0)
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
