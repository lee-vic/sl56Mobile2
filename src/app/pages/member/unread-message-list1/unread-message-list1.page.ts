import { Component, OnInit } from '@angular/core';
import { InstantMessageService } from 'src/app/providers/instant-message.service';
import { Router, NavigationExtras } from '@angular/router';

@Component({
  selector: 'app-unread-message-list1',
  templateUrl: './unread-message-list1.page.html',
  styleUrls: ['./unread-message-list1.page.scss'],
})
export class UnreadMessageList1Page implements OnInit {
  items:Array<any>=[];
  constructor( public service:InstantMessageService, private router: Router) { }

  ngOnInit() {
  }
  getData(){
    this.service.getMessages1().subscribe(res=>{
      this.items=res;
      console.log(this.items);
    });
  }
 
  detail(data) {
    let extras: NavigationExtras = {
      state: {
        receiveGoodsDetailId: data.ReceiveGoodsDetailId
      }
    }
    this.router.navigate(["/member/chat/1"], extras)
  }
  ionViewDidEnter() {
    this.getData();
   }
}
