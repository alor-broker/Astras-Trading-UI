import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestIdeasCompactComponent } from './invest-ideas-compact.component';
import { MockProvider } from "ng-mocks";
import { HistoryService } from "../../../../shared/services/history.service";
import { EMPTY } from "rxjs";

describe('InvestIdeasCompactComponent', () => {
  let component: InvestIdeasCompactComponent;
  let fixture: ComponentFixture<InvestIdeasCompactComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestIdeasCompactComponent],
      providers:[
        MockProvider(
          HistoryService,
          {
            getLastTwoCandles: () => EMPTY
          }
        )
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvestIdeasCompactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
