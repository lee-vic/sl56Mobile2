import { Component, OnInit, ViewChild } from '@angular/core';
import { Notice } from 'src/app/interfaces/notice';
import { NoticeService } from 'src/app/providers/notice.service';
import { IonInfiniteScroll, NavController } from '@ionic/angular';

@Component({
  selector: 'app-notice-list',
  templateUrl: './notice-list.page.html',
  styleUrls: ['./notice-list.page.scss'],
})
export class NoticeListPage implements OnInit {
  isBusy: boolean = false;
  currentPageIndex: number = 1;
  items: Array<Notice> = [];
  @ViewChild(IonInfiniteScroll,{static:true}) infiniteScroll: IonInfiniteScroll;
  constructor(private service: NoticeService,public navCtrl: NavController) { }

  ngOnInit(): void {
    this.getItems();
  }
  ionViewDidLoad() {
    console.log('ionViewDidLoad NoticePage');
  }
  getItems() {

    if (this.isBusy)
      return;
    this.isBusy = true;
    this.service.getNoticeList(this.currentPageIndex).subscribe(res => {
      if (res.length <10) {
        this.infiniteScroll.disabled=true;
      }
      else {
        for (var i = 0; i < res.length; i++) {
          this.items.push(res[i]);
        }
        this.currentPageIndex++;
      }
      if (this.infiniteScroll != null)
      this.infiniteScroll.complete();
      this.isBusy = false;
    });
  }
  openDetail(item:Notice) {
    item.IsRead=true;
    this.navCtrl.navigateForward("/member/notice-detail/"+item.NoticeId);
  }

}
