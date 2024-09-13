import {
  Component,
  Inject,
  OnInit
} from '@angular/core';
import {
  USER_CONTEXT,
  UserContext
} from "../../../shared/services/auth/user-context";
import {
  map,
  Observable
} from "rxjs";

@Component({
  selector: 'ats-admin-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.less'
})
export class AdminDashboardComponent implements OnInit {
  userLogin$!: Observable<string>;

  constructor(
    @Inject(USER_CONTEXT)
    private readonly userContext: UserContext
  ) {
  }

  ngOnInit(): void {
    this.userLogin$ = this.userContext.getUser().pipe(
      map(x => x.login)
    );
  }
}
