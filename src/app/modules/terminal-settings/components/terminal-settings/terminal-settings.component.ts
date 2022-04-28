import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup} from '@angular/forms';
import { Observable, of } from 'rxjs';
import { FullName } from '../../../../shared/models/user/full-name.model';
import { TerminalSettingsService } from '../../services/terminal-settings.service';

@Component({
  selector: 'ats-terminal-settings',
  templateUrl: './terminal-settings.component.html',
  styleUrls: ['./terminal-settings.component.less']
})
export class TerminalSettingsComponent implements OnInit {

  constructor(private service: TerminalSettingsService) { }

  fullName$: Observable<FullName> = of({
    firstName: '',
    lastName: '',
    secondName: ''
  });

  form!: FormGroup;

  ngOnInit(): void {
    this.fullName$ = this.service.getFullName();
    this.form = new FormGroup({
      hasVerticalScroll: new FormControl(false),
    });
  }

  submitForm(): void {

  }
}
