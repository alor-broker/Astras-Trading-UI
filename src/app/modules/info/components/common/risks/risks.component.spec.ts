import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RisksComponent } from './risks.component';
import { InfoService } from "../../../services/info.service";
import { of } from "rxjs";
import { getTranslocoModule } from "../../../../../shared/utils/testing";

describe('RisksComponent', () => {
  let component: RisksComponent;
  let fixture: ComponentFixture<RisksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RisksComponent ],
      imports: [
        getTranslocoModule()
      ],
      providers: [
        {
          provide: InfoService,
          useValue: {
            getRisksInfo: jasmine.createSpy('getRisksInfo').and.returnValue(of({}))
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RisksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
