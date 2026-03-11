import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WaitingReturnEventsService {
  private readonly reloadWaitingReturnSubject = new Subject<void>();

  onReloadWaitingReturn(): Observable<void> {
    return this.reloadWaitingReturnSubject.asObservable();
  }

  notifyReloadWaitingReturn(): void {
    this.reloadWaitingReturnSubject.next();
  }
}
