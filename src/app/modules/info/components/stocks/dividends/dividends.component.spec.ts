import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { InfoService } from '../../../services/info.service';

import { DividendsComponent } from './dividends.component';

describe('DividendsComponent', () => {
  let component: DividendsComponent;
  let fixture: ComponentFixture<DividendsComponent>;

  const infoSpy = jasmine.createSpyObj('InfoService', ['getDividends', 'getExchangeInfo']);
  infoSpy.getDividends.and.returnValue(of([]));

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DividendsComponent],
      providers: [
        { provide: InfoService, useValue: infoSpy }
      ]

    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DividendsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
