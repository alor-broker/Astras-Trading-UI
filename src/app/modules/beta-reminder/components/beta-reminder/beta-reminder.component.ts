import { Component, OnInit } from '@angular/core';
import { map, of } from 'rxjs';
import { ClientService } from 'src/app/shared/services/client.service';

@Component({
  selector: 'ats-beta-reminder',
  templateUrl: './beta-reminder.component.html',
  styleUrls: ['./beta-reminder.component.less']
})
export class BetaReminderComponent implements OnInit {
  fullName$ = of('');

  constructor(private readonly client: ClientService) { }

  ngOnInit(): void {
    this.fullName$ = this.client.getFullName().pipe(
      map(f => `${f.firstName} ${f.secondName} ${f.lastName}`)
    );
  }

}
