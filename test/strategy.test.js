import { InternalOAuthError } from 'passport-oauth2';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Strategy } from '../lib/strategy.js';

const mockUserProfile = {
  id: 12345,
  sub: '12345',
  username: 'testuser',
  login: 'testuser',
  name: 'Test User',
  email: 'test@example.com',
  avatar_template: '/user_avatar/default/{size}/12345.png',
  avatar_url: 'https://cdn.linux.do/user_avatar/default/120/12345.png',
  active: true,
  trust_level: 2,
  silenced: false,
  external_ids: null,
  api_key: '',
};

describe('Strategy', () => {
  let strategy;
  let verifyCallback;

  beforeEach(() => {
    verifyCallback = vi.fn();
    strategy = new Strategy(
      {
        clientID: 'test-client-id',
        clientSecret: 'test-client-secret',
        callbackURL: 'http://localhost:3000/auth/callback',
      },
      verifyCallback,
    );
  });

  describe('constructor', () => {
    it('should set strategy name to "linuxdo"', () => {
      expect(strategy.name).toBe('linuxdo');
    });

    it('should set authorizationURL to LinuxDO Connect', () => {
      expect(strategy._oauth2._authorizeUrl).toBe('https://connect.linux.do/oauth2/authorize');
    });

    it('should set tokenURL to LinuxDO Connect', () => {
      expect(strategy._oauth2._accessTokenUrl).toBe('https://connect.linux.do/oauth2/token');
    });

    it('should enable authorization header for GET requests', () => {
      expect(strategy._oauth2._useAuthorizationHeaderForGET).toBe(true);
    });

    it('should pass options and verify callback to parent OAuth2Strategy', () => {
      const newVerify = vi.fn();
      const s = new Strategy(
        {
          clientID: 'my-id',
          clientSecret: 'my-secret',
          callbackURL: 'http://example.com/callback',
        },
        newVerify,
      );

      expect(s.name).toBe('linuxdo');
      expect(s._oauth2._clientId).toBe('my-id');
    });
  });

  describe('userProfile', () => {
    it('should fetch user profile with access token and return parsed profile', async () => {
      const accessToken = 'mock-access-token';
      const profileJson = JSON.stringify(mockUserProfile);

      vi.spyOn(strategy._oauth2, 'get').mockImplementation((url, token, callback) => {
        expect(url).toBe('https://connect.linux.do/api/user');
        expect(token).toBe(accessToken);
        callback(null, profileJson, { statusCode: 200 });
      });

      const result = await new Promise((resolve) => {
        strategy.userProfile(accessToken, (err, profile) => {
          resolve({ err, profile });
        });
      });

      expect(result.err).toBeNull();
      expect(result.profile).toEqual(mockUserProfile);
      expect(result.profile.id).toBe(12345);
      expect(result.profile.username).toBe('testuser');
      expect(result.profile.email).toBe('test@example.com');
      expect(result.profile.trust_level).toBe(2);
    });

    it('should return InternalOAuthError when OAuth request fails', async () => {
      const accessToken = 'mock-access-token';
      const oauthError = new Error('OAuth request failed');

      vi.spyOn(strategy._oauth2, 'get').mockImplementation((url, token, callback) => {
        callback(oauthError, null, null);
      });

      const result = await new Promise((resolve) => {
        strategy.userProfile(accessToken, (err, profile) => {
          resolve({ err, profile });
        });
      });

      expect(result.err).toBeInstanceOf(InternalOAuthError);
      expect(result.err.message).toBe('Get User Profile Failed');
      expect(result.profile).toBeUndefined();
    });

    it('should return Error when response body is not valid JSON', async () => {
      const accessToken = 'mock-access-token';

      vi.spyOn(strategy._oauth2, 'get').mockImplementation((url, token, callback) => {
        callback(null, 'not valid json{', { statusCode: 200 });
      });

      const result = await new Promise((resolve) => {
        strategy.userProfile(accessToken, (err, profile) => {
          resolve({ err, profile });
        });
      });

      expect(result.err).toBeInstanceOf(Error);
      expect(result.err.message).toBe('User Profile Parsing Failed');
      expect(result.profile).toBeUndefined();
    });

    it('should return Error when response body is empty', async () => {
      const accessToken = 'mock-access-token';

      vi.spyOn(strategy._oauth2, 'get').mockImplementation((url, token, callback) => {
        callback(null, '', { statusCode: 200 });
      });

      const result = await new Promise((resolve) => {
        strategy.userProfile(accessToken, (err, profile) => {
          resolve({ err, profile });
        });
      });

      expect(result.err).toBeInstanceOf(Error);
      expect(result.err.message).toBe('User Profile Parsing Failed');
      expect(result.profile).toBeUndefined();
    });

    it('should handle profile with all field types correctly', async () => {
      const accessToken = 'mock-access-token';
      const fullProfile = {
        id: 99999,
        sub: '99999',
        username: 'fulluser',
        login: 'fulluser',
        name: 'Full User',
        email: 'full@example.com',
        avatar_template: '/avatar/{size}/full.png',
        avatar_url: 'https://cdn.linux.do/avatar/full.png',
        active: false,
        trust_level: 4,
        silenced: true,
        external_ids: { github: '12345' },
        api_key: 'some-key',
      };
      const profileJson = JSON.stringify(fullProfile);

      vi.spyOn(strategy._oauth2, 'get').mockImplementation((url, token, callback) => {
        callback(null, profileJson, { statusCode: 200 });
      });

      const result = await new Promise((resolve) => {
        strategy.userProfile(accessToken, (err, profile) => {
          resolve({ err, profile });
        });
      });

      expect(result.err).toBeNull();
      expect(result.profile).toEqual(fullProfile);
      expect(result.profile.external_ids).toEqual({ github: '12345' });
      expect(result.profile.active).toBe(false);
      expect(result.profile.silenced).toBe(true);
    });
  });
});
