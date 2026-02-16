import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MoneyOperationsWidgetComponent } from './money-operations-widget.component';
import { WidgetInstance } from '../../../../shared/models/dashboard/dashboard-item.model';
import { provideTransloco } from '@jsverse/transloco';

describe('MoneyOperationsWidgetComponent', () => {
  let component: MoneyOperationsWidgetComponent;
  let fixture: ComponentFixture<MoneyOperationsWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoneyOperationsWidgetComponent],
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

    fixture = TestBed.createComponent(MoneyOperationsWidgetComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('widgetInstance', {
      instance: {
        guid: '123'
      }
    } as WidgetInstance);
    fixture.componentRef.setInput('isBlockWidget', false);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
