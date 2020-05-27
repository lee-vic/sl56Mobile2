import { Component, OnInit } from '@angular/core';
import { InstantMessageService } from 'src/app/providers/instant-message.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-unread-message-list',
  templateUrl: './unread-message-list.page.html',
  styleUrls: ['./unread-message-list.page.scss'],
})
export class UnreadMessageListPage implements OnInit {

  data:any={};
  ngOnInit(): void {
   
  }
  getData(){
    this.service.getUnReadMessage().subscribe(res=>{
      this.data=res;
     
    });
  }
  constructor(
    public service:InstantMessageService,
    private router: Router,
     ) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad UnreadMessageListPage');
  }
  detail(type){
    if(type==0){
      this.router.navigate(["/member", "chat", 0])
    }
    else{
      this.router.navigate(["/member", "unread-message-list1"])
    }
  }
  ionViewDidEnter() {
   this.getData();
  }

}
