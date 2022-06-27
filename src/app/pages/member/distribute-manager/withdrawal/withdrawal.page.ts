import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-withdrawal',
  templateUrl: './withdrawal.page.html',
  styleUrls: ['./withdrawal.page.scss']
})
export class WithdrawalPage implements OnInit {

  constructor(private navCtrl:NavController) { }

  ngOnInit(): void {
  }

  userInfo(){
    this.navCtrl.navigateForward("/member/distribute-user-info");
  }

}
