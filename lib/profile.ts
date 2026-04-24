export interface StandardProfile {
  provider: string;
  id: string;
  displayName: string;
  emails: Array<{ value: string }>;
  _raw: string;
  _json: any;
}

export interface UserProfile {
  id: number;
  sub: string;
  username: string;
  login: string;
  name: string;
  email: string;
  avatar_template: string;
  avatar_url: string;
  active: boolean;
  trust_level: number;
  silenced: boolean;
  external_ids: unknown | null;
  api_key: string;
}

export const parse = (data: StandardProfile): UserProfile => {
    return JSON.parse(data._raw) as UserProfile;
}

