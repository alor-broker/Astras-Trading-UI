import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import { CurrentPositionPanelComponent } from './current-position-panel.component';
import { ScalperOrderBookDataContextService } from '../../services/scalper-order-book-data-context.service';
import { Subject } from 'rxjs';
import { LetDirective } from "@ngrx/component";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";

describe('CurrentPositionPanelComponent', () => {
  let component: CurrentPositionPanelComponent;
  let fixture: ComponentFixture<CurrentPositionPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports:[
        TranslocoTestsModule.getModule(),
        LetDirective
      ],
      declarations: [CurrentPositionPanelComponent],
      providers: [
        {
          provide: ScalperOrderBookDataContextService,
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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
