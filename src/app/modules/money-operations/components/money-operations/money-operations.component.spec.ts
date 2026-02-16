import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MoneyOperationsComponent } from './money-operations.component';
import { provideTransloco } from '@jsverse/transloco';

describe('MoneyOperationsComponent', () => {
  let component: MoneyOperationsComponent;
  let fixture: ComponentFixture<MoneyOperationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoneyOperationsComponent],
      providers: [
        provideTransloco({
          config: {
            availableLangs: ['en', 'ru'],
            defaultLang: 'en',
          },
          loader: {} as any
        })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MoneyOperationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
