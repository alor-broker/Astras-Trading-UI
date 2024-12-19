import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { FinanceComponent } from './finance.component';
import { TranslocoTestsModule } from "../../../../../shared/utils/testing/translocoTestsModule";

describe('FinanceComponent', () => {
  let component: FinanceComponent;
  let fixture: ComponentFixture<FinanceComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FinanceComponent,
        TranslocoTestsModule.getModule()
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FinanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
