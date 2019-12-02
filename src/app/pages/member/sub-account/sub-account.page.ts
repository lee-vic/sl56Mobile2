import { Component, OnInit } from '@angular/core';
import { SubAccount } from 'src/app/interfaces/sub-account';
import { NavController } from '@ionic/angular';
import { SubAccountService } from 'src/app/providers/sub-account.service';

@Component({
  selector: 'app-sub-account',
  templateUrl: './sub-account.page.html',
  styleUrls: ['./sub-account.page.scss'],
})
export class SubAccountPage implements OnInit {

  items: Array<SubAccount> = [];

  constructor(public navCtrl: NavController,
    private service: SubAccountService,
    ) {
  }

  ngOnInit(): void {
    //this.getList();
  }
  getList(){
    this.service.getList().subscribe(res => {
      this.items.length=0;
      this.items = res;
    });
  }
  ionViewDidLoad() {
    console.log('ionViewDidLoad SubAccountPage');
  }
  add() {
    this.navCtrl.navigateForward("/member/sub-account-detail/");
  }
  detail(item: SubAccount) {
    this.navCtrl.navigateForward("/member/sub-account-detail/"+ item.ObjectId);
    // this.navCtrl.push(UserEditSubAccountPage, {
    //   id: item.ObjectId
    // });
  }
  ionViewDidEnter() {
    console.log("ionViewDidEnter");
     this.getList();
   
  }
}
