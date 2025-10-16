import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { InvestIdeasDetailsDialogComponent } from './invest-ideas-details-dialog.component';
import {
  MockComponent,
  MockProvider
} from "ng-mocks";
import { HistoryService } from "../../../../shared/services/history.service";
import { EMPTY } from "rxjs";
import { NzModalComponent } from "ng-zorro-antd/modal";

describe('InvestIdeasDetailsDialogComponent', () => {
  let component: InvestIdeasDetailsDialogComponent;
  let fixture: ComponentFixture<InvestIdeasDetailsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        InvestIdeasDetailsDialogComponent,
        MockComponent(NzModalComponent)
      ],
      providers: [
        MockProvider(
          HistoryService,
          {
            getLastTwoCandles: () => EMPTY
          }
        ),
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(InvestIdeasDetailsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
