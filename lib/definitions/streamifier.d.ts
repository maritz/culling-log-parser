// todo: submit to definitelytyped

declare module "streamifier" {
  interface IReadableOptions {
    highWaterMark?: number;
    encoding?: string;
  }

  interface IMultiStream extends NodeJS.ReadableStream {
    new (object: any, options: IReadableOptions): IMultiStream;
  }
  interface IStreamifier {
    createReadStream(object: any, options?: IReadableOptions): IMultiStream;
  }
  var _createReadStream: IStreamifier
  export = _createReadStream;
}
