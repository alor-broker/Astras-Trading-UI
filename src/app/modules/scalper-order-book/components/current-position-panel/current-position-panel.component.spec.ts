import {ComponentFixture, TestBed} from '@angular/core/testing';
import {CurrentPositionPanelComponent} from './current-position-panel.component';
import {ScalperOrderBookDataProvider} from '../../services/scalper-order-book-data-provider.service';
import {Subject} from 'rxjs';
import {LetDirective} from "@ngrx/component";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockDirectives} from "ng-mocks";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('CurrentPositionPanelComponent', () => {
  let component: CurrentPositionPanelComponent;
  let fixture: ComponentFixture<CurrentPositionPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        LetDirective,
        CurrentPositionPanelComponent,
        MockDirectives(
          NzTooltipDirective
        )
      ],
      providers: [
        {
          provide: ScalperOrderBookDataProvider,
          useValue: {
            getSettingsStream: jasmine.createSpy('getSettingsStream').and.returnValue(new Subject()),
            getOrderBookPortfolio: jasmine.createSpy('getOrderBookPortfolio').and.returnValue(new Subject()),
            getOrderBookStream: jasmine.createSpy('getOrderBookStream').and.returnValue(new Subject()),
            getOrderBookPositionStream: jasmine.createSpy('getOrderBookPositionStream').and.returnValue(new Subject()),
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CurrentPositionPanelComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
