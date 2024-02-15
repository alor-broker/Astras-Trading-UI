import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BondScreenerComponent } from './bond-screener.component';
import { Apollo } from "apollo-angular";
import { of } from "rxjs";

describe('BondScreenerComponent', () => {
  let component: BondScreenerComponent;
  let fixture: ComponentFixture<BondScreenerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BondScreenerComponent],
      providers: [
        {
          provide: Apollo,
          useValue: {
            watchQuery: jasmine.createSpy('watchQuery').and.returnValue({ valueChanges: of({})})
          }
        }
      ]
    });
    fixture = TestBed.createComponent(BondScreenerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
