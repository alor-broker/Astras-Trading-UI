import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ModifiersIndicatorComponent } from './modifiers-indicator.component';
import { Subject } from "rxjs";
import { ScalperHotKeyCommandService } from "../../services/scalper-hot-key-command.service";
import {MockDirectives} from "ng-mocks";
import {NzIconDirective} from "ng-zorro-antd/icon";

describe('ModifiersIndicatorComponent', () => {
  let component: ModifiersIndicatorComponent;
  let fixture: ComponentFixture<ModifiersIndicatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [
      ModifiersIndicatorComponent,
      MockDirectives(
        NzIconDirective
      )
    ],
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
