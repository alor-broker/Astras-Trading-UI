import { Component, OnInit } from '@angular/core';
import { map, of } from 'rxjs';
import { AccountService } from 'src/app/shared/services/account.service';

@Component({
  selector: 'ats-beta-reminder',
  templateUrl: './beta-reminder.component.html',
  styleUrls: ['./beta-reminder.component.less']
})
export class BetaReminderComponent implements OnInit {
  fullName$ = of('');

  constructor(private readonly client: AccountService) { }

  ngOnInit(): void {
    this.fullName$ = this.client.getFullName().pipe(
      map(f => `${f.firstName} ${f.secondName} ${f.lastName}`)
    );
  }

}
