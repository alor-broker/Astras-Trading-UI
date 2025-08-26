import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdeasSectionDetailsComponent } from './ideas-section-details.component';
import {
  MockComponent,
  MockProvider
} from "ng-mocks";
import { EMPTY } from "rxjs";
import { NzModalComponent } from "ng-zorro-antd/modal";
import { HistoryService } from "../../../../shared/services/history.service";

describe('IdeasSectionDetailsComponent', () => {
  let component: IdeasSectionDetailsComponent;
  let fixture: ComponentFixture<IdeasSectionDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        IdeasSectionDetailsComponent,
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

    fixture = TestBed.createComponent(IdeasSectionDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
