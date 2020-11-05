import { Component, OnInit } from '@angular/core';
import { InstantMessageService } from 'src/app/providers/instant-message.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-unread-message-list',
  templateUrl: './unread-message-list.page.html',
  styleUrls: ['./unread-message-list.page.scss'],
})
export class UnreadMessageListPage implements OnInit {
  customerId: number;
  data: any = {};
  ngOnInit(): void {

  }
  getData() {
    this.service.getUnReadMessage().subscribe(res => {
      this.data = res;

    });
  }
  getData1() {
    this.service.getUnReadMessage1(this.customerId).subscribe(res => {
      this.data = res;

    });
  }
  constructor(
    public service: InstantMessageService,
    private router: Router,
    private route: ActivatedRoute,
    public toastCtrl: ToastController
  ) {
    this.route.queryParams.subscribe(params => {
      this.customerId = params.customerId;
    });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad UnreadMessageListPage');
  }
  detail(type) {
    if (type == 0) {
      if (this.data.Count2 > 0) {
        this.router.navigate(["/member", "chat", 0])
      }
      else {
        this.toastCtrl.create({
          message: "暂无未读消息",
          position: 'middle',
          duration: 1500
        }).then(p => p.present());
      }

    }
    else {
      if (this.data.Count1 > 0) {
        this.router.navigate(["/member", "unread-message-list1"])
      }
      else {
        this.toastCtrl.create({
          message: "暂无未读消息",
          position: 'middle',
          duration: 1500
        }).then(p => p.present());
      }
    }
  }
  ionViewDidEnter() {
    console.log(this.customerId);
    if (this.customerId == undefined) {
      this.getData();
    }
    else {
      this.getData1();
    }

  }

}
