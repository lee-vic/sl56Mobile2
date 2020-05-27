import { Component, OnInit } from '@angular/core';
import { InstantMessageService } from 'src/app/providers/instant-message.service';

@Component({
  selector: 'app-unread-message-list1',
  templateUrl: './unread-message-list1.page.html',
  styleUrls: ['./unread-message-list1.page.scss'],
})
export class UnreadMessageList1Page implements OnInit {
  items:Array<any>=[];
  constructor( public service:InstantMessageService,) { }

  ngOnInit() {
  }
  getData(){
    this.service.getMessages1().subscribe(res=>{
      this.items=res;
      console.log(this.items);
    });
  }
  detail(item){
    // this.navCtrl.push(UserChatPage, {
    //   receiveGoodsDetailId: item.ReceiveGoodsDetailId,
    //   messageType:1
    // });
  }
  ionViewDidEnter() {
    this.getData();
   }
}
