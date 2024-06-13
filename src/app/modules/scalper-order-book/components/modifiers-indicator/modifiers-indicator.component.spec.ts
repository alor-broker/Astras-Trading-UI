import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ModifiersIndicatorComponent } from './modifiers-indicator.component';
import { Subject } from "rxjs";
import { ScalperHotKeyCommandService } from "../../services/scalper-hot-key-command.service";

describe('ModifiersIndicatorComponent', () => {
  let component: ModifiersIndicatorComponent;
  let fixture: ComponentFixture<ModifiersIndicatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModifiersIndicatorComponent],
      providers: [
        {
          provide: ScalperHotKeyCommandService,
          useValue: {
            command$: new Subject(),
            modifiers$: new Subject()
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ModifiersIndicatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
