import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import { Subject } from 'rxjs';
import { PanelResizeHandlerComponent } from "./panel-resize-handler.component";
import { PANEL_RESIZE_CONTEXT } from "../tokens";

describe('PanelResizeHandlerComponent', () => {
  let component: PanelResizeHandlerComponent;
  let fixture: ComponentFixture<PanelResizeHandlerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PanelResizeHandlerComponent],
      providers: [
        {
          provide: PANEL_RESIZE_CONTEXT,
          useValue: {
            resizeEndOutsideAngular$: new Subject(),
            resizedOutsideAngular$: new Subject()
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(PanelResizeHandlerComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
