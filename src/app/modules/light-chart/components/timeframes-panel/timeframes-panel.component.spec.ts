import {ComponentFixture, TestBed} from '@angular/core/testing';

import {TimeframesPanelComponent} from './timeframes-panel.component';
import {LetDirective} from "@ngrx/component";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockComponents, MockDirectives} from "ng-mocks";
import {NzResizeObserverDirective} from "ng-zorro-antd/cdk/resize-observer";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzDropdownButtonDirective, NzDropDownDirective, NzDropdownMenuComponent} from "ng-zorro-antd/dropdown";
import {NzMenuDirective, NzMenuItemComponent} from "ng-zorro-antd/menu";

describe('TimeframesPanelComponent', () => {
  let component: TimeframesPanelComponent;
  let fixture: ComponentFixture<TimeframesPanelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        LetDirective,
        TranslocoTestsModule.getModule(),
        TimeframesPanelComponent,
        MockComponents(
          NzButtonComponent,
          NzDropdownMenuComponent,
          NzMenuItemComponent
        ),
        MockDirectives(
          NzResizeObserverDirective,
          NzDropdownButtonDirective,
          NzDropDownDirective,
          NzMenuDirective
        )
      ]
    });
    fixture = TestBed.createComponent(TimeframesPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
