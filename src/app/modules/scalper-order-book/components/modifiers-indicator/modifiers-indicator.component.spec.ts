import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ModifiersIndicatorComponent } from './modifiers-indicator.component';
import { HotKeyCommandService } from "../../../../shared/services/hot-key-command.service";
import { Subject } from "rxjs";

describe('ModifiersIndicatorComponent', () => {
  let component: ModifiersIndicatorComponent;
  let fixture: ComponentFixture<ModifiersIndicatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModifiersIndicatorComponent],
      providers: [
        {
          provide: HotKeyCommandService,
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
