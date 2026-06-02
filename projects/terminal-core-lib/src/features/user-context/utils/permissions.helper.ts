import {
  Permission,
  User
} from '../user.types';

export class PermissionsHelper {
  static hasPermission(user: User, permission: Permission): boolean {
    return (user.permissions ?? []).includes(permission);
  }
}
