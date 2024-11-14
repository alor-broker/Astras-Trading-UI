import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WidgetsGalleryComponent } from './widgets-gallery.component';
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import {MockDirective} from "ng-mocks";
import {NzIconDirective} from "ng-zorro-antd/icon";

describe('WidgetsGalleryComponent', () => {
  let component: WidgetsGalleryComponent;
  let fixture: ComponentFixture<WidgetsGalleryComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        WidgetsGalleryComponent,
        TranslocoTestsModule.getModule(),
        MockDirective(NzIconDirective)
      ],
    });
    fixture = TestBed.createComponent(WidgetsGalleryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
