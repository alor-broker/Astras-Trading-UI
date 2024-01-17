import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import { PanelsContainerComponent } from "./panels-container.component";

describe('PanelsContainerComponent', () => {
  let component: PanelsContainerComponent;
  let fixture: ComponentFixture<PanelsContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PanelsContainerComponent],
    })
      .compileComponents();

    fixture = TestBed.createComponent(PanelsContainerComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
