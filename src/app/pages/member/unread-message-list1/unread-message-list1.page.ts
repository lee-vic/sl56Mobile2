import { Component, OnInit, OnDestroy } from '@angular/core';
import { InstantMessageService } from 'src/app/providers/instant-message.service';
import { Router, NavigationExtras, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-unread-message-list1',
  templateUrl: './unread-message-list1.page.html',
  styleUrls: ['./unread-message-list1.page.scss'],
})
export class UnreadMessageList1Page implements OnInit, OnDestroy {
  items: Array<any> = [];
  isLoading = true;
  loadError = false;
  readonly loadingPlaceholders = [1, 2, 3];
  private readonly destroy$ = new Subject<void>();

  constructor(
    public service: InstantMessageService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.getData();
  }

  ionViewWillEnter() {
    this.getData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getData() {
    this.isLoading = this.items.length === 0;
    this.loadError = false;
    this.service.getMessages1()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.items = res || [];
          this.isLoading = false;
        },
        error: () => {
          this.loadError = true;
          this.isLoading = false;
        }
      });
  }

  detail(data) {
    const extras: NavigationExtras = {
      state: {
        receiveGoodsDetailId: data.ReceiveGoodsDetailId
      }
    };
    this.router.navigate(['/member/chat/1'], extras);
  }
}
