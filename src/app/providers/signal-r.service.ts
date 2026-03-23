import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';

declare var $: any;

interface SignalRStatus {
  name: string;
}

const SIGNALR_URL = environment.signalR.url;
const SIGNALR_HUB = environment.signalR.hub;
const SIGNALR_WITH_CREDENTIALS = environment.signalR.withCredentials;
const SIGNALR_RETRY_MAX_ATTEMPTS = environment.signalR.retry.maxAttempts;
const SIGNALR_RETRY_BASE_DELAY_MS = environment.signalR.retry.baseDelayMs;
const SIGNALR_RETRY_MAX_DELAY_MS = environment.signalR.retry.maxDelayMs;
const SIGNALR_ENABLE_LOG = environment.signalR.log;

export class SignalRConnection {
  status: Subject<SignalRStatus> = new Subject<SignalRStatus>();
  private connection: any;
  private hubProxy: any;
  private readonly hubName: string;
  private readonly forceRegisterEventName = '__forceHubRegistration__';
  private startRetryTimer: any;
  private isStopped: boolean = false;

  constructor(private url: string, hubName: string, private withCredentials: boolean) {
    this.hubName = hubName;
    this.initializeConnection();
  }

  private initializeConnection(): void {
    this.connection = $.hubConnection(this.url, { useDefaultPath: false });
    this.connection.logging = SIGNALR_ENABLE_LOG;
    this.connection.disconnected(() => this.status.next({ name: 'disconnected' }));
    this.connection.reconnecting(() => this.status.next({ name: 'reconnecting' }));
    this.connection.reconnected(() => this.status.next({ name: 'connected' }));
    this.hubProxy = this.connection.createHubProxy(this.hubName);
    // Force hub registration so SignalR handshake sends non-empty connectionData.
    this.hubProxy.on(this.forceRegisterEventName, () => null);
  }

  start(): Promise<SignalRConnection> {
    this.isStopped = false;
    if (this.startRetryTimer) {
      clearTimeout(this.startRetryTimer);
      this.startRetryTimer = null;
    }
    return this.startInternal(1);
  }

  private startInternal(attempt: number): Promise<SignalRConnection> {
    if (attempt > 1) {
      this.initializeConnection();
    }

    // Explicitly set hub registration payload so negotiate/connect does not send connectionData=[].
    this.connection.data = JSON.stringify([{ name: this.hubName.toLowerCase() }]);

    return new Promise((resolve, reject) => {
      this.connection
        .start({ withCredentials: this.withCredentials })
        .done(() => {
          this.startRetryTimer = null;
          this.status.next({ name: 'connected' });
          resolve(this);
        })
        .fail((error: any) => {
          if (!this.isStopped && attempt < SIGNALR_RETRY_MAX_ATTEMPTS) {
            const delay = this.getRetryDelay(attempt);
            this.status.next({ name: 'reconnecting' });
            this.startRetryTimer = setTimeout(() => {
              this.startInternal(attempt + 1).then(resolve).catch(reject);
            }, delay);
            return;
          }

          if (SIGNALR_ENABLE_LOG) {
            console.error('[SignalR] Connection failed for hub:', this.hubName, error);
          }
          this.status.next({ name: 'disconnected' });
          reject(error);
        });
    });
  }

  private getRetryDelay(attempt: number): number {
    const exponentialDelay = SIGNALR_RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
    return Math.min(exponentialDelay, SIGNALR_RETRY_MAX_DELAY_MS);
  }

  listenFor(eventName: string): Subject<any> {
    const eventStream = new Subject<any>();
    this.hubProxy.on(eventName, (data: any) => eventStream.next(data));
    return eventStream;
  }

  invoke(methodName: string, ...args: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      this.hubProxy
        .invoke(methodName, ...args)
        .done((data: any) => resolve(data))
        .fail((error: any) => reject(error));
    });
  }

  stop(): void {
    this.isStopped = true;
    if (this.startRetryTimer) {
      clearTimeout(this.startRetryTimer);
      this.startRetryTimer = null;
    }
    if (this.connection) {
      this.connection.stop();
      this.status.next({ name: 'disconnected' });
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class SignalR {
  createConnection(): SignalRConnection {
    return new SignalRConnection(SIGNALR_URL, SIGNALR_HUB, SIGNALR_WITH_CREDENTIALS);
  }
}