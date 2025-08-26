import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestIdeasCarouselComponent } from './invest-ideas-carousel.component';
import {
  MockComponent,
  MockProvider
} from "ng-mocks";
import { HistoryService } from "../../../../shared/services/history.service";
import { EMPTY } from "rxjs";
import { NzModalComponent } from "ng-zorro-antd/modal";

describe('InvestIdeasCarouselComponent', () => {
  let component: InvestIdeasCarouselComponent;
  let fixture: ComponentFixture<InvestIdeasCarouselComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        InvestIdeasCarouselComponent,
        MockComponent(NzModalComponent)
      ],
      providers: [
        MockProvider(
          HistoryService,
          {
            getLastTwoCandles: () => EMPTY
          }
        )
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
