import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ScalperOrderBookComponent} from './scalper-order-book.component';
import {NEVER,} from 'rxjs';
import {LetDirective} from "@ngrx/component";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {ScalperOrderBookDataProvider} from "../../services/scalper-order-book-data-provider.service";
import {MockComponents, MockProvider} from "ng-mocks";
import {ScalperOrderBookBodyComponent} from "../scalper-order-book-body/scalper-order-book-body.component";
import {CurrentPositionPanelComponent} from "../current-position-panel/current-position-panel.component";
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('ScalperOrderBookComponent', () => {
  let component: ScalperOrderBookComponent;
  let fixture: ComponentFixture<ScalperOrderBookComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        LetDirective,
        ScalperOrderBookComponent,
        MockComponents(
          ScalperOrderBookBodyComponent,
          CurrentPositionPanelComponent,
        )
      ],
      providers: [
        MockProvider(ScalperOrderBookDataProvider, {
          getSettingsStream: () => NEVER
        })
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ScalperOrderBookComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
