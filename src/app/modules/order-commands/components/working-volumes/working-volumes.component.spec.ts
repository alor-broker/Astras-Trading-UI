import {ComponentFixture, TestBed} from '@angular/core/testing';

import {WorkingVolumesComponent} from './working-volumes.component';
import {Subject} from "rxjs";
import {SubscriptionsDataFeedService} from "../../../../shared/services/subscriptions-data-feed.service";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockDirectives} from "ng-mocks";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";

describe('WorkingVolumesComponent', () => {
  let component: WorkingVolumesComponent;
  let fixture: ComponentFixture<WorkingVolumesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        WorkingVolumesComponent,
        MockDirectives(
          NzTooltipDirective
        )
      ],
      providers: [
        {
          provide: SubscriptionsDataFeedService,
          useValue: {
            subscribe: jasmine.createSpy('subscribe').and.returnValue(new Subject())
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(WorkingVolumesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
