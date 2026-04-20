import {Permission, User} from "../models/user/user.model";

export class PermissionsHelper {
  static hasPermission(user: User, permission: Permission): boolean {
    return (user.permissions ?? []).includes(permission);
  }
}
