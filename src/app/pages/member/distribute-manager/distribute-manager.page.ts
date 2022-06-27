import { Component, OnInit } from '@angular/core';
import { Menu, MenuRow, Menus } from 'src/app/interfaces/menu';
import { UserService } from '../../../providers/user.service'
import { DistributeService } from 'src/app/providers/distribute.service';
import { ToastController } from '@ionic/angular';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-distribute-manager',
  templateUrl: './distribute-manager.page.html',
  styleUrls: ['./distribute-manager.page.scss']
})
export class DistributeManagerPage implements OnInit {

  allMenus: Array<Menu> = [
    { title: "我的伙伴", image: "assets/imgs/member-2.png", type: [1], url: "/member/distribute-partners" },
    { title: "收益概况", image: "assets/imgs/member-3.png", type: [1], url: "/member/distribute-profit" },
    { title: "提现管理", image: "assets/imgs/member-5.png", type: [1], url: "/member/distribute-withdrawal" },
    { title: "分享中心", image: "assets/imgs/member-6.png", type: [1], url: "/member/distribute-share" },
    { title: "用户中心", image: "assets/imgs/member-7.png", type: [1], url: "/member/distribute-user-info" },
    { title: "常见问题", image: "assets/imgs/member-8.png", type: [1], url: "/member/distribute-faq" }
  ];
  menus:Menus;
  customerInfo:any=null;
  dayAmount;
  monthAmount;
  constructor(
    private userService:UserService,
    private distributeService:DistributeService,
    private toastCtrl:ToastController,
    private navCtrl:NavController
    ) 
    {

    }

  ngOnInit(): void {
    this.getCustomerInfo();
    let rowIndex = 0;
    this.menus = new Menus();
    this.menus.rows = [];
    for (var i = 0; i < this.allMenus.length; i++) {
      if (i % 2 == 0) {
        let newRow = new MenuRow();
        newRow.items = [];
        this.menus.rows.push(newRow);
        if (i > 0)
          rowIndex++;
      }
      this.menus.rows[rowIndex].items.push(this.allMenus[i]);
      console.log(this.menus);
    }
    this.distributeService.getProfits("今日").subscribe(res=>{
      this.dayAmount=res.SumAmount;
    });
    this.distributeService.getProfits("本月").subscribe(res=>{
      this.monthAmount=res.SumAmount;
    });
  }

  getCustomerInfo(){
    this.userService.getHomeInfo().subscribe(res=>{
      console.log("customerINfo",res);
      this.customerInfo=res;
    });
  }
  menuClick(item){
    this.navCtrl.navigateForward(item.url);
  }
  oneKeyRegister(){
    this.distributeService.oneKeyRegister().subscribe(res=>{
      console.log("oneKeyRes:",res);
      if(res.length>0){
        let toast = this.toastCtrl.create({
          message: "操作异常"+res,
          position: 'middle',
          duration: 3000
        }).then(p=>p.present());
      }else{
        let toast = this.toastCtrl.create({
          message: "注册成功",
          position: 'middle',
          duration: 3000
        }).then(p=>p.present());
        this.customerInfo.Category=1;
      }
    });;
  }

}
