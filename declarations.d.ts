// expo-file-system/next doesn't export its types via the package manifest.
declare module 'expo-file-system/next' {
  export class File {
    constructor(uri: string);
    bytes(): Promise<Uint8Array>;
  }
}
