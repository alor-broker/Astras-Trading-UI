import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WidgetsGalleryComponent } from './widgets-gallery.component';
import { getTranslocoModule } from "../../../../shared/utils/testing";
import { NzDrawerModule } from "ng-zorro-antd/drawer";

describe('WidgetsGalleryComponent', () => {
  let component: WidgetsGalleryComponent;
  let fixture: ComponentFixture<WidgetsGalleryComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        getTranslocoModule(),
        NzDrawerModule
      ],
      declarations: [WidgetsGalleryComponent]
    });
    fixture = TestBed.createComponent(WidgetsGalleryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
