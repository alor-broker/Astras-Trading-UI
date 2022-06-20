import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllTradesWidgetComponent } from './all-trades-widget.component';
import { AllTradesService } from "../../services/all-trades.service";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { sharedModuleImportForTests } from "../../../../shared/utils/testing";

describe('AllTradesWidgetComponent', () => {
  let component: AllTradesWidgetComponent;
  let fixture: ComponentFixture<AllTradesWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, ...sharedModuleImportForTests],
      declarations: [ AllTradesWidgetComponent ],
      providers: [
        {
          provide: AllTradesService,
          useValue: {
            init: jasmine.createSpy('init').and.callThrough()
          }
        }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AllTradesWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
