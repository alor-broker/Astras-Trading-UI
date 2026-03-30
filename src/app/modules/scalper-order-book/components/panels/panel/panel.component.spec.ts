import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import { PANELS_CONTAINER_CONTEXT } from "../tokens";
import { PanelComponent } from "./panel.component";

describe('PanelComponent', () => {
  let component: PanelComponent;
  let fixture: ComponentFixture<PanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [PanelComponent],
    providers: [
        {
            provide: PANELS_CONTAINER_CONTEXT,
            useValue: {
                onPanelResized: (): void => {
                },
                onPanelResizeCompleted: (): void => {
                },
                expandPanel: (): void => {
                },
                restore: (): void => {
                },
            }
        }
    ]
})
      .compileComponents();

    fixture = TestBed.createComponent(PanelComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
