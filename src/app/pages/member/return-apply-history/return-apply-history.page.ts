import { Component, OnInit } from '@angular/core';
import { NavController, ModalController } from '@ionic/angular';
import { ReturnService } from 'src/app/providers/return.service';

@Component({
  selector: 'app-return-apply-history',
  templateUrl: './return-apply-history.page.html',
  styleUrls: ['./return-apply-history.page.scss'],
})
export class ReturnApplyHistoryPage implements OnInit {

  items: Array<string> = [];
  currentItem: string = "";
  ngOnInit(): void {
    this.service.applyHistory().subscribe(res => {
      this.items = res;
    });
  }

  constructor(public navCtrl: NavController,
    public modalController: ModalController,
    public service: ReturnService) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ReturnApplyHistoryPage');
  }
  
  select(){
    this.modalController.dismiss({ 'val': this.currentItem });
  }

}
