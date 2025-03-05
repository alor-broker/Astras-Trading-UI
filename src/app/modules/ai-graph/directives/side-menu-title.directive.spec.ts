import { SideMenuTitleDirective } from './side-menu-title.directive';
import {MockService} from "ng-mocks";
import {TemplateRef} from "@angular/core";

describe('SideMenuTitleDirective', () => {
  it('should create an instance', () => {
    const directive = new SideMenuTitleDirective(MockService(TemplateRef<unknown>));
    expect(directive).toBeTruthy();
  });
});
