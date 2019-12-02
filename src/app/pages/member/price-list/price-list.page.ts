import { Component, OnInit, ViewChild } from '@angular/core';
import { PriceInfo } from 'src/app/interfaces/price';
import { apiUrl } from 'src/app/global';
import { NavController, NavParams, IonInfiniteScroll } from '@ionic/angular';
import { PriceService } from 'src/app/providers/price.service';

@Component({
  selector: 'app-price-list',
  templateUrl: './price-list.page.html',
  styleUrls: ['./price-list.page.scss'],
})
export class PriceListPage implements OnInit {
  @ViewChild(IonInfiniteScroll,{static:true}) infiniteScroll: IonInfiniteScroll;
  currentPageIndex: number = 1;
  items: PriceInfo[] = [];
  isBusy: boolean = false;
  allowDownload:boolean=false;
  downloadUrl:string=apiUrl + "/Price/Download";
  constructor(public navCtrl: NavController,
    private service: PriceService) {
  }
  ngOnInit(): void {
    this.getItems(null);
  }
  ionViewDidLoad() {
    console.log('ionViewDidLoad PriceListPage');
  }
  getItems(ev) {
    if (this.isBusy == true)
      return;
    this.isBusy = true;
    this.service.getList(this.currentPageIndex).subscribe(res => {
      this.allowDownload=res.AllowDownloadPrice;
      if (res.Items.length < 10&&ev!=null) {
        this.infiniteScroll.disabled=true;
      }
      for (var i = 0; i < res.Items.length; i++) {
        this.items.push(res.Items[i]);
      }
      this.currentPageIndex++;
      if (ev != null)
        this.infiniteScroll.complete();
      this.isBusy = false;
    });
  }
}