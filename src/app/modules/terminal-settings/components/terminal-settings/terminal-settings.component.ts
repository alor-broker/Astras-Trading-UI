import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { FullName } from '../../models/full-name.model';
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
  })

  ngOnInit(): void {
    this.fullName$ = this.service.getFullName()
  }

}
