import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OperationsHistoryWidgetComponent } from './operations-history-widget.component';
import { WidgetInstance } from '../../../../shared/models/dashboard/dashboard-item.model';
import { provideTransloco } from '@jsverse/transloco';

describe('OperationsHistoryWidgetComponent', () => {
  let component: OperationsHistoryWidgetComponent;
  let fixture: ComponentFixture<OperationsHistoryWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperationsHistoryWidgetComponent],
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

    fixture = TestBed.createComponent(OperationsHistoryWidgetComponent);
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
