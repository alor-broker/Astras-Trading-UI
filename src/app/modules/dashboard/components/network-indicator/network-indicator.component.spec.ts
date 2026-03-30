import {ComponentFixture, TestBed} from '@angular/core/testing';

import {NetworkIndicatorComponent} from './network-indicator.component';
import {NetworkStatusService} from '../../../../shared/services/network-status.service';
import {BehaviorSubject,} from 'rxjs';
import {NetworkStatus} from '../../../../shared/models/enums/network-status.model';
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {provideHttpClient} from "@angular/common/http";
import {MockComponents, MockDirectives} from "ng-mocks";
import {NzTypographyComponent} from "ng-zorro-antd/typography";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {NzIconDirective} from "ng-zorro-antd/icon";

describe('NetworkIndicatorComponent', () => {
  let component: NetworkIndicatorComponent;
  let fixture: ComponentFixture<NetworkIndicatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NetworkIndicatorComponent,
        TranslocoTestsModule.getModule(),
        MockComponents(
          NzTypographyComponent,
        ),
        MockDirectives(
          NzTooltipDirective,
          NzIconDirective
        )
      ],
      providers: [
        {
          provide: NetworkStatusService,
          useValue: {
            status$: new BehaviorSubject(NetworkStatus.Online),
            lastOrderDelayMSec$: new BehaviorSubject(0)
          }
        },
        provideHttpClient()
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
