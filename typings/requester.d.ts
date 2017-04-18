declare module Requester {
  interface DatabaseRequest<T> {
    query: T;
    context?: { [key: string]: any };
    req?: any;
  }

  interface PlywoodRequester<T> {
    (request: DatabaseRequest<T>): Q.Promise<any>;
  }
}
