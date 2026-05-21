let _userId: string | null = null;

export function setSessionUserId(id: string | null) {
  _userId = id;
}

export function getSessionUserId(): string | null {
  return _userId;
}
