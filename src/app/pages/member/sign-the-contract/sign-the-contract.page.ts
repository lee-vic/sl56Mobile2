import { LoadingController, NavController } from '@ionic/angular';
import { FadadaService } from '../../../providers/fadada.service';
import { Component, OnInit } from '@angular/core';
import { FadadaSignTask } from 'src/app/interfaces/fadada-sign-task';
import { MemberPage } from '../../tabs/member/member.page';

@Component({
  selector: 'app-sign-the-contract',
  templateUrl: './sign-the-contract.page.html',
  styleUrls: ['./sign-the-contract.page.scss']
})
export class SignTheContractComponent implements OnInit {

  constructor(public faDaDaService: FadadaService, public loadingCtrl: LoadingController, public navCtrl: NavController) {
  }

  list1: Array<FadadaSignTask> = []; // 待签署合同列表
  list2: Array<FadadaSignTask> = []; // 已签署合同列表
  list3: Array<FadadaSignTask> = []; // 其他合同列表
  showType = '0'; // 0:待签署 1:已签署 2:其他
  ngOnInit(): void {
    console.log(this.navCtrl);
    this.loadingCtrl.create({
      message: '加载中...'
    }).then(p => {
      p.present();
      this.faDaDaService.getSignTasks().subscribe(res => {
        p.dismiss();
        console.log(res);
        this.list1 = res.filter(item => item.StatusIndex < 6);
        this.list2 = res.filter(item => item.StatusIndex == 6);
        this.list3 = res.filter(item => item.StatusIndex > 6);
      });
    });
  }
  segmentChanged(event) {
    console.log('Segment changed', event.detail.value);
    this.showType = event.detail.value;
  }

  get showList(): Array<FadadaSignTask> {
    if(this.showType == '0') {
      return this.list1;
    } else if(this.showType=='1') {
      return this.list2;
    } else {
      return this.list3;
    }
  }

  getShowButtonType(row: FadadaSignTask): number {
    let buttonType = -1; //-1:不显示按钮 0:填写按钮 1:签署按钮 2:查看按钮 3:等待其他人完成填写 4:等待发起方定稿 5:等待其他人完成签署
    if (this.showType == '0') {
      if (row.StatusIndex == 2) {//合同状态是填写进行中
        if (row.ActorStatus == "待填写") {
          buttonType = 0;
        } else {
          buttonType = 3;
        }
      } else if (row.StatusIndex == 3 || row.StatusIndex == 4) {//合同状态是填写完成 或者 签署进行中
        if (row.ActorStatus == "待签署") {
          buttonType = 1;
        } else {
          buttonType = 5;
        }
      }
    }else if(this.showType=='1') {
      buttonType = 2;
    }
    else {
      buttonType = -1;
    }
    return buttonType;
  }

  goToSignTask(item: FadadaSignTask) {
    this.loadingCtrl.create({
      message: '加载中...'
    }).then(p => {
      p.present();
      this.faDaDaService.getSignTaskUrl(item.SignTaskId, item.ActorId).subscribe(res => {
        p.dismiss();
        window.location.href = res;
      });
    });
  }

  goToPreview(item: FadadaSignTask) {
    this.loadingCtrl.create({
      message: '加载中...'
    }).then(p => {
      p.present();
      this.faDaDaService.getSignTaskUrl(item.SignTaskId, item.ActorId).subscribe(res => {
        p.dismiss();
        window.open(res, '_blank');
      });
    });
  }
  
}
