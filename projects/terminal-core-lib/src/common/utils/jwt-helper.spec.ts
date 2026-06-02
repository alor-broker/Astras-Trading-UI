import {
  JwtBody,
  JwtHelper
} from './jwt-helper';

describe('JwtHelper', () => {
  describe('decodeJwtBody', () => {
    function buildJwt(body: JwtBody): string {
      const header = btoa(JSON.stringify({alg: 'HS256', typ: 'JWT'}));
      const payload = btoa(JSON.stringify(body));

      return `${header}.${payload}.signature`;
    }

    it('should decode the payload segment into the JWT body', () => {
      const body: JwtBody = {
        exp: 1893456000,
        portfolios: 'D1234 D5678',
        clientid: 'client-1',
        ein: 'EIN-1',
        agreements: 'AG1 AG2',
        sub: 'user@example.com'
      };

      expect(JwtHelper.decodeJwtBody(buildJwt(body))).toEqual(body);
    });
  });
});
