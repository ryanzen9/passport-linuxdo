import { InternalOAuthError, Strategy as OAuth2Strategy } from 'passport-oauth2';
import { type UserProfile } from './profile.js';

export class Strategy  extends OAuth2Strategy {
    constructor(options: any, verify: any) {
    super({
      ...options,
      authorizationURL: 'https://connect.linux.do/oauth2/authorize',
      tokenURL: 'https://connect.linux.do/oauth2/token',
    }, verify);

    this.name = 'linuxdo';
    this._oauth2.useAuthorizationHeaderforGET(true);
  }

  userProfile(accessToken: string, done: (err?: Error | null, profile?: any) => void) {
    this._oauth2.get('https://connect.linux.do/api/user', accessToken, (err, body, res) => {
      if (err) {
        return done(new InternalOAuthError('Get User Profile Failed', err));
      }

      try {
        const profile: UserProfile = JSON.parse(body as string) ;
        done(null, profile);
      } catch (ex) {
        done(new Error('User Profile Parsing Failed'));
      }
    });
  }
}
