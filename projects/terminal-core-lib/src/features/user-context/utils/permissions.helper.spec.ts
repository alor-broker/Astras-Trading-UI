import {PermissionsHelper} from './permissions.helper';
import {
  Permission,
  User
} from '../user.types';

describe('PermissionsHelper', () => {
  function createUser(permissions?: Permission[]): User {
    return {portfolios: [], permissions};
  }

  describe('hasPermission', () => {
    it('should return true when the user holds the permission', () => {
      const user = createUser([Permission.CancelOrder, Permission.EditOrder]);

      expect(PermissionsHelper.hasPermission(user, Permission.EditOrder)).toBe(true);
    });

    it('should return false when the user lacks the permission', () => {
      const user = createUser([Permission.CancelOrder]);

      expect(PermissionsHelper.hasPermission(user, Permission.ClosePosition)).toBe(false);
    });

    it('should treat a user without a permissions list as having none', () => {
      expect(PermissionsHelper.hasPermission(createUser(undefined), Permission.CancelOrder)).toBe(false);
    });
  });
});
