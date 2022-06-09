import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import { interval, map, Observable, of } from "rxjs";
import { delay } from "rxjs/operators";
import { NewsItemInfo, NewsList, NewsListItem } from "../models/news.model";

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private newsUrl = environment.apiUrl;

  private id = 1;

  constructor(
    private http: HttpClient
  ) {}

  public getNews(): Observable<NewsList> {
    return of({
      list: [
        {id: this.id++, title: 'Some news ' + this.id, pubDate: new Date().toString()},
        {id: this.id++, title: 'Some news ' + this.id, pubDate: new Date().toString()},
        {id: this.id++, title: 'Some news ' + this.id, pubDate: new Date().toString()},
        {id: this.id++, title: 'Some news ' + this.id, pubDate: new Date().toString()},
        {id: this.id++, title: 'Some news ' + this.id, pubDate: new Date().toString()},
        {id: this.id++, title: 'Some news ' + this.id, pubDate: new Date().toString()},
        {id: this.id++, title: 'Some news ' + this.id, pubDate: new Date().toString()},
        {id: this.id++, title: 'Some news ' + this.id, pubDate: new Date().toString()},
        {id: this.id++, title: 'Some news ' + this.id, pubDate: new Date().toString()},
        {id: this.id++, title: 'Some news ' + this.id, pubDate: new Date().toString()},
        {id: this.id++, title: 'Some news ' + this.id, pubDate: new Date().toString()},
        {id: this.id++, title: 'Some news ' + this.id, pubDate: new Date().toString()},
        {id: this.id++, title: 'Some news ' + this.id, pubDate: new Date().toString()},
        {id: this.id++, title: 'Soooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooome news ' + this.id, pubDate: new Date().toString()},
        {id: this.id++, title: 'Some news ' + this.id, pubDate: new Date().toString()},
        {id: this.id++, title: 'Some news ' + this.id, pubDate: new Date().toString()},
        {id: this.id++, title: 'Some news ' + this.id, pubDate: new Date().toString()},
        {id: this.id++, title: 'Some news ' + this.id, pubDate: new Date().toString()},
        {id: this.id++, title: 'Some news ' + this.id, pubDate: new Date().toString()},
        {id: this.id++, title: 'Some news ' + this.id, pubDate: new Date().toString()},
        {id: this.id++, title: 'Some news ' + this.id, pubDate: new Date().toString()},
        {id: this.id++, title: 'Some news ' + this.id, pubDate: new Date().toString()},
        {id: this.id++, title: 'Some news ' + this.id, pubDate: new Date().toString()},
        {id: this.id++, title: 'Some news ' + this.id, pubDate: new Date().toString()},
        {id: this.id++, title: 'Some news ' + this.id, pubDate: new Date().toString()},
      ],
      total: 100
    })
      .pipe(delay(2000));
  }

  public getNewsSub(): Observable<NewsListItem> {
    return interval(60000)
      .pipe(map(() => ({id: this.id++, title: 'Some news ' + this.id, pubDate: new Date().toString()})));
  }

  public getNewsItemInfo(newsId: number | null): Observable<NewsItemInfo> {
    return of({
      id: this.id++,
      title: 'Some news ' + this.id,
      desc: `News description News description News description News description News description News description News description
      News description News description News description News description News description News description News description News description
      News description News description News description News description News description News description News description News description
      News description News description News description News description News description News description News description News description
      News description News description News description News description News description News description News description News description
      `,
      pubDate: new Date().toString()
    });
  }
}
