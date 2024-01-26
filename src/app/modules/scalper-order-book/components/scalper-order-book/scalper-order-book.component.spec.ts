import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ScalperOrderBookComponent } from './scalper-order-book.component';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { Subject } from 'rxjs';
import {
  getTranslocoModule,
  mockComponent
} from '../../../../shared/utils/testing';
import { LetDirective } from "@ngrx/component";

describe('ScalperOrderBookComponent', () => {
  let component: ScalperOrderBookComponent;
  let fixture: ComponentFixture<ScalperOrderBookComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports:[
        getTranslocoModule(),
        LetDirective
      ],
      declarations: [
        ScalperOrderBookComponent,
        mockComponent({ selector: 'ats-working-volumes-panel' }),
        mockComponent({ selector: 'ats-modifiers-indicator' }),
        mockComponent({ selector: 'ats-scalper-order-book-body' }),
        mockComponent({ selector: 'ats-current-position-panel' }),
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject())
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ScalperOrderBookComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
