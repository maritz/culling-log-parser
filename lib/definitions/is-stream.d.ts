// todo: submit to definitelytyped

declare module "is-stream" {

  interface IisStream {
    writable(object: any): boolean;
    readable(object: any): boolean;
    duplex(object: any): boolean;
    transform(object: any): boolean;
  }
  var _isStream: IisStream;
  export = _isStream;
}
