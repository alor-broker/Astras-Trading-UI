import { Component } from '@angular/core';
import {NewYearHelper} from "../../../modules/dashboard/utils/new-year.helper";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {RouterLink} from "@angular/router";

@Component({
    selector: 'ats-astras-logo',
    imports: [
        NzIconDirective,
        RouterLink
    ],
    templateUrl: './astras-logo.component.html',
    styleUrl: './astras-logo.component.less'
})
export class AstrasLogoComponent {
  showNewYearIcon = NewYearHelper.showNewYearIcon;
}
