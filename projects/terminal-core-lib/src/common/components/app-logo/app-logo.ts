import {Component} from '@angular/core';
import {RouterLink} from '@angular/router';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NewYearHelper} from '../../utils/new-year.helper';

@Component({
  selector: 'ats-app-logo',
  imports: [
    RouterLink,
    NzIconDirective
  ],
  templateUrl: './app-logo.html',
  styleUrl: './app-logo.less',
})
export class AppLogo {
  showNewYearIcon = NewYearHelper.showNewYearIcon;
}
