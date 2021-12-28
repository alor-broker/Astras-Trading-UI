import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { LimitCommand } from '../models/limit-command.model';

@Injectable({
  providedIn: 'root'
})
export class CommandsService {

  private url = environment.apiUrl + '/order'

  constructor(private http: HttpClient) { }

  submitLimit(command: LimitCommand) {
    return this.http.post(this.url, command).pipe(
      tap(resp => {
        console.log(resp);
      })
    )
  }
}
