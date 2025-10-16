import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { InvestIdeasCarouselComponent } from './invest-ideas-carousel.component';
import {
  MockComponent,
  MockProvider
} from "ng-mocks";
import { EMPTY } from "rxjs";
import { NzModalComponent } from "ng-zorro-antd/modal";
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import { InvestIdeasService } from "../../services/invest-ideas.service";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { InvestIdeasDetailsDialogComponent } from "../invest-ideas-details-dialog/invest-ideas-details-dialog.component";

describe('InvestIdeasCarouselComponent', () => {
  let component: InvestIdeasCarouselComponent;
  let fixture: ComponentFixture<InvestIdeasCarouselComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        InvestIdeasCarouselComponent,
        MockComponent(NzModalComponent),
        MockComponent(InvestIdeasDetailsDialogComponent),
        TranslocoTestsModule.getModule()
      ],
      providers: [
        MockProvider(
          InvestIdeasService,
          {
            getIdeas: () => EMPTY
          }
        ),
        MockProvider(InstrumentsService)
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(InvestIdeasCarouselComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
