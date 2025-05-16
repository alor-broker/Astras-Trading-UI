import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstrumentIconComponent } from './instrument-icon.component';
import { MockProvider } from "ng-mocks";
import { EnvironmentService } from "../../services/environment.service";

describe('InstrumentIconComponent', () => {
  let component: InstrumentIconComponent;
  let fixture: ComponentFixture<InstrumentIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstrumentIconComponent],
      providers: [
        MockProvider(
          EnvironmentService,
          {
            alorIconsStorageUrl: ''
          }
        )
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstrumentIconComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('symbol', '');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
