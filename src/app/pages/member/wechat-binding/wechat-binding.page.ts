import { Component, OnInit } from '@angular/core';
import { WechatBindingService } from 'src/app/providers/wechat-binding.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-wechat-binding',
  templateUrl: './wechat-binding.page.html',
  styleUrls: ['./wechat-binding.page.scss'],
})
export class WechatBindingPage implements OnInit {

  list:any;

  constructor(
    public service:WechatBindingService,
    public alertCtrl: AlertController,
    ) {
  }
  ngOnInit(): void {
    this.service.getList().subscribe(res=>{
      this.list=res;
    })
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad WechatBindingPage');
  }
  onItemDeleteClick(item){
    this.alertCtrl.create({
      header: '解除微信账号绑定',
      message: '解除绑定后你无法使用微信快捷登陆，除非您再次绑定',
      buttons: [
        {
          text: '取消',
          handler: () => {
            console.log('Disagree clicked');
          }
        },
        {
          text: '确定',
          handler: () => {
            this.service.delete(item.Id).subscribe(res=>{
              this.list=res;
            });
          }
        }
      ]
    }).then(p=>p.present());
    
  }

}
