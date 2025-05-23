import { JwtHelper } from './jwt-helper';
import { JwtBody } from '../models/user/jwt.model';

describe('JwtHelper', () => {
  describe('decodeJwtBody', () => {
    it('should correctly decode a valid JWT string and return the JwtBody', () => {
      const mockPayload: JwtBody = {
        sub: '1234567890',
        exp: 1516239022,
        portfolios: 'portfolio1,portfolio2',
        clientid: 'client123',
        ein: 'ein123',
        agreements: 'agreement1'
      };
      const encodedPayload = btoa(JSON.stringify(mockPayload));
      const mockJwt = `header.${encodedPayload}.signature`;

      const decodedBody = JwtHelper.decodeJwtBody(mockJwt);

      expect(decodedBody).toEqual(mockPayload);
    });

    it('should correctly decode a JWT with an empty payload object', () => {
      const mockPayload: JwtBody = {
        sub: '',
        exp: 0,
        portfolios: '',
        clientid: '',
        ein: '',
        agreements: ''
      };
      const encodedPayload = btoa(JSON.stringify(mockPayload));
      const mockJwt = `h.${encodedPayload}.s`; // Shorter header/signature for brevity

      const decodedBody = JwtHelper.decodeJwtBody(mockJwt);

      expect(decodedBody).toEqual(mockPayload);
    });

    it('should throw an error if JWT string is null', () => {
      expect(() => JwtHelper.decodeJwtBody(null as any)).toThrow();
    });

    it('should throw an error if JWT string is undefined', () => {
      expect(() => JwtHelper.decodeJwtBody(undefined as any)).toThrow();
    });

    it('should throw an error if JWT has no dots (e.g., "singleparttoken")', () => {
      const malformedJwt = 'singleparttoken';
      // jwt.split('.')[1] will be undefined, atob(undefined) will throw
      expect(() => JwtHelper.decodeJwtBody(malformedJwt)).toThrow();
    });

    it('should throw SyntaxError if the payload part is present but empty (e.g., "header..signature")', () => {
      const malformedJwt = 'header..signature'; // jwt.split('.')[1] will be ""
      // atob("") returns ""
      // JSON.parse("") throws SyntaxError
      expect(() => JwtHelper.decodeJwtBody(malformedJwt)).toThrowError(SyntaxError);
    });

    it('should throw SyntaxError if the payload part is an empty string after base64 encoding (e.g. "header..." where payload is btoa(""))', () => {
      const emptyPayload = btoa(""); // results in ""
      const jwtWithEmptyDecodedPayload = `header.${emptyPayload}.signature`;
      // atob("") is ""
      // JSON.parse("") throws SyntaxError
      expect(() => JwtHelper.decodeJwtBody(jwtWithEmptyDecodedPayload)).toThrowError(SyntaxError);
    });

    it('should throw an error if the payload is not valid Base64', () => {
      const malformedJwt = 'header.not-valid-base64!.signature';
      // atob("not-valid-base64!") will throw (DOMException in browser)
      expect(() => JwtHelper.decodeJwtBody(malformedJwt)).toThrow();
    });

    it('should throw SyntaxError if the decoded payload is not valid JSON', () => {
      const nonJsonPayload = btoa('this is not valid json string');
      const malformedJwt = `header.${nonJsonPayload}.signature`;
      // JSON.parse("this is not valid json string") throws SyntaxError
      expect(() => JwtHelper.decodeJwtBody(malformedJwt)).toThrowError(SyntaxError);
    });

    it('should handle JWTs with special characters in payload values', () => {
      const mockPayload: JwtBody = {
        sub: 'user@example.com',
        exp: 1678886400, // Example timestamp
        portfolios: 'portfolio with spaces,another portfolio/slashes',
        clientid: 'client-id-with-"quotes"',
        ein: 'ein-with-\nnewlines',
        agreements: 'agreement1'
      };
      const encodedPayload = btoa(JSON.stringify(mockPayload));
      const mockJwt = `h.${encodedPayload}.s`;

      const decodedBody = JwtHelper.decodeJwtBody(mockJwt);
      expect(decodedBody).toEqual(mockPayload);
    });
  });
});
