import { Component, OnInit } from '@angular/core';
import { InstantMessageService } from 'src/app/providers/instant-message.service';
import { Router, NavigationExtras, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-unread-message-list1',
  templateUrl: './unread-message-list1.page.html',
  styleUrls: ['./unread-message-list1.page.scss'],
})
export class UnreadMessageList1Page implements OnInit {
  items: Array<any> = [];
  isLoading: boolean = true;
  readonly loadingPlaceholders = [1, 2, 3];
  constructor(public service: InstantMessageService, private router: Router, private route: ActivatedRoute) {

  }

  ngOnInit() {
    this.getData();
  }
  getData() {
    this.isLoading = true;
    this.service.getMessages1().subscribe({
      next: res => {
        this.items = res || [];
      },
      error: () => {
        this.items = [];
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
  getData1() {
    this.getData();
  }

  detail(data) {
    let extras: NavigationExtras = {
      state: {
        receiveGoodsDetailId: data.ReceiveGoodsDetailId
      }
    }
    this.router.navigate(["/member/chat/1"], extras)
  }
}
