export interface IUser {
  id: number;
  username: string;
  email: string;
  password: string;
  photo?: Uint8Array | null;
  phoneNumber?: string | null;
  createdAt: Date;
  type: string;
  historyRest: number[];
  wishList: number[];
}

export interface IUserPayload {
  id: number;
  username: string;
  email: string;
  type: string;
}

export interface IUserValidSchemaRegistration {
  id?: number;
  username: string;
  email: string;
  password: string;
  phoneNumber?: string;
}
