import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ScalperOrderBookComponent } from './scalper-order-book.component';
import {
  NEVER,
} from 'rxjs';
import { LetDirective } from "@ngrx/component";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { ComponentHelpers } from "../../../../shared/utils/testing/component-helpers";
import { ScalperOrderBookDataContextService } from "../../services/scalper-order-book-data-context.service";
import { MockProvider } from "ng-mocks";

describe('ScalperOrderBookComponent', () => {
  let component: ScalperOrderBookComponent;
  let fixture: ComponentFixture<ScalperOrderBookComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports:[
        TranslocoTestsModule.getModule(),
        LetDirective
      ],
      declarations: [
        ScalperOrderBookComponent,
        ComponentHelpers.mockComponent({ selector: 'ats-working-volumes-panel' }),
        ComponentHelpers.mockComponent({ selector: 'ats-modifiers-indicator' }),
        ComponentHelpers.mockComponent({ selector: 'ats-scalper-order-book-body' }),
        ComponentHelpers.mockComponent({ selector: 'ats-current-position-panel' }),
      ],
      providers: [
        MockProvider(
          ScalperOrderBookDataContextService,
          {
            getSettingsStream: () => NEVER
          }
        )
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ScalperOrderBookComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
