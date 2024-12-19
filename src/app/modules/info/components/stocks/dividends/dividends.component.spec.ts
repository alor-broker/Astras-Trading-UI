import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { DividendsComponent } from './dividends.component';
import { TranslocoTestsModule } from "../../../../../shared/utils/testing/translocoTestsModule";

describe('DividendsComponent', () => {
  let component: DividendsComponent;
  let fixture: ComponentFixture<DividendsComponent>;
  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DividendsComponent,
        TranslocoTestsModule.getModule()
      ],
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
