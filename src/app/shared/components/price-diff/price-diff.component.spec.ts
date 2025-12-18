import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PriceDiffComponent } from './price-diff.component';
import { ThemeService } from "../../services/theme.service";
import { Subject } from "rxjs";

describe('PriceDiffComponent', () => {
  let component: PriceDiffComponent;
  let fixture: ComponentFixture<PriceDiffComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [PriceDiffComponent],
    providers: [
        {
            provide: ThemeService,
            useValue: {
                getThemeSettings: jasmine.createSpy('getThemeSettings').and.returnValue(new Subject())
            }
        }
    ]
});
    fixture = TestBed.createComponent(PriceDiffComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
