import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WidgetsGalleryComponent } from './widgets-gallery.component';
import { NzDrawerModule } from "ng-zorro-antd/drawer";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";

describe('WidgetsGalleryComponent', () => {
  let component: WidgetsGalleryComponent;
  let fixture: ComponentFixture<WidgetsGalleryComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
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
