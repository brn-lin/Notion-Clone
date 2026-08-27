export type User = {
  id: string;
  email: string;
  username: string | null;
};

export type LoginResponse = {
  token: string;
  user: User;
};
