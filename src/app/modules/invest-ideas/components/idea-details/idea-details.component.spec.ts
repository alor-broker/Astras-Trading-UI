import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdeaDetailsComponent } from './idea-details.component';
import {
  MockComponent,
  MockProvider
} from "ng-mocks";
import { NzModalComponent } from "ng-zorro-antd/modal";
import { HistoryService } from "../../../../shared/services/history.service";
import { EMPTY } from "rxjs";
import { InstrumentsService } from "../../../instruments/services/instruments.service";

describe('IdeaDetailsComponent', () => {
  let component: IdeaDetailsComponent;
  let fixture: ComponentFixture<IdeaDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        IdeaDetailsComponent,
        MockComponent(NzModalComponent)
      ],
      providers: [
        MockProvider(
          HistoryService,
          {
            getLastTwoCandles: () => EMPTY
          }
        ),
        MockProvider(InstrumentsService)
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IdeaDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
