import { NotificationsProvider } from '../notifications-provider';
import {
  Observable,
  of
} from 'rxjs';
import { NotificationMeta } from '../../models/notification.model';

export class TestNotificationsProvider implements NotificationsProvider {
  getNotifications(): Observable<NotificationMeta[]> {
    const now = new Date();

    return of([
      {
        id: '1',
        date: now,
        title: 'Long long long long long long long long long long title',
        description: 'Description Description Description Description Description Description',
        isRead: false,
        showDate: true,
        open: (): void => {
        }
      },
      {
        id: '2',
        date: new Date(new Date().setMinutes(now.getMinutes() - 10)),
        title: 'Test 2',
        description: 'Description Description Description Description Description Description',
        isRead: true,
        showDate: true
      },
      {
        id: '3',
        date: new Date(new Date().setMinutes(now.getMinutes() - 2)),
        title: 'Test 3',
        description: 'Description Description Description Description Description Description',
        isRead: false,
        showDate: true
      },
      {
        id: '4',
        date: new Date(new Date().setMinutes(now.getMinutes() - 3)),
        title: 'Test 4',
        description: '',
        isRead: false,
        showDate: false
      },
      {
        id: '5',
        date: new Date(new Date().setMinutes(now.getMinutes() - 4)),
        title: 'Test 5',
        description: 'Description Description Description Description Description Description',
        isRead: false,
        showDate: true
      },
      {
        id: '6',
        date: new Date(new Date().setMinutes(now.getMinutes() - 5)),
        title: 'Test 6',
        description: 'Description Description Description Description Description Description',
        isRead: false,
        showDate: true
      },
      {
        id: '7',
        date: new Date(new Date().setMinutes(now.getMinutes() - 6)),
        title: 'Test 7',
        description: 'Description Description Description Description Description Description',
        isRead: false,
        showDate: true
      },
      {
        id: '8',
        date: new Date(new Date().setMinutes(now.getMinutes() - 7)),
        title: 'Test 8',
        description: 'Description Description Description Description Description Description',
        isRead: false,
        showDate: true
      }
    ]);
  }
}
