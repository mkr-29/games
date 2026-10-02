export type WorkerInMessage =
  | { type: 'INIT'; payload: { sharedBuffer?: SharedArrayBuffer } }
  | { type: 'PING'; payload: string }
  | { type: 'COMMAND'; payload: any };

export type WorkerOutMessage =
  | { type: 'READY'; version: string; crossOriginIsolated: boolean; sharedMemoryAttached: boolean }
  | { type: 'PONG'; message: string }
  | { type: 'ERROR'; error: string };
