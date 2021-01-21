import { Component, OnInit, ViewChild } from '@angular/core';
import{ IonCheckbox,AlertController,Events,NavController} from '@ionic/angular';
import{ReturnService} from 'src/app/providers/return.service';
import{DeliveryRecord} from 'src/app/interfaces/delivery-record';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';

@Component({
  selector: 'app-return-waiting',
  templateUrl: './return-waiting.page.html',
  styleUrls: ['./return-waiting.page.scss']
})
export class ReturnWaitingPage implements OnInit {
  items:Array<DeliveryRecord>=[];
  isEdit:boolean=false;
  selectedCount:number=0;
  navigationSubscription;
  constructor(
    public service:ReturnService,
    public alert:AlertController,
    public events:Events,
    public navCtrl:NavController,
    private router: Router,
    private route: ActivatedRoute) {
      this.navigationSubscription = this.router.events.subscribe((event: any) => {
        if (event instanceof NavigationEnd) {
          this.getWaitingReturnList();
        }
       });
     }
  @ViewChild('ckAll',{static:true}) ckAll:IonCheckbox;
  ngOnInit(): void {
    // this.getWaitingReturnList();
  }

  ngOnDestroy(): void {
    if (this.navigationSubscription) {
     this.navigationSubscription.unsubscribe();
    }
  }
  
  check(item:DeliveryRecord){
    item.Selected=!item.Selected;
    this.selectedCount=this.items.filter(p=>p.Selected).length;
    this.ckAll.checked=this.selectedCount==this.items.length;
  }

  getWaitingReturnList(){
    this.service.getWaitReturnList().subscribe(res=>{
        this.items=new Array();
        res.forEach(item => {
          this.items.push(item);
        });
        this.selectedCount=0;
        this.ckAll.checked=false;
    });
  }

  edit(){
      this.isEdit=!this.isEdit;
  }

  remove(){
    let ids = this.items.filter(p=>p.Selected).map(p=>p.Id).toString();
    this.service.removeWaitReturnList(ids).subscribe(res=>{
      this.items = this.items.filter(p=>!p.Selected);
      this.selectedCount=0;
      this.ckAll.checked=false;
    });
  }

  async clear(){
    if(this.items.length==0) return;
    const alert = await this.alert.create({
      header: '提示',
      message: '确定清空列表吗',
      buttons: [
        {
          text: '取消'
        }, {
          text: '确定',
          handler: () => {
            this.service.clearWaitReturnList().subscribe(res=>{
              this.items=[];
              this.ckAll.checked=false;
            });
          }
        }
      ]
    });

    await alert.present();
  }

  goReturn(){
    let ids =this.items.filter(p=>p.Selected).map(p=>p.Id).toString();
    this.navCtrl.navigateForward("/member/return-apply", { queryParams: { type: 0,ids:ids } })
  }

  selectAll(){
    this.items.forEach(item=>{
      item.Selected=!this.ckAll.checked;
    });
    this.selectedCount=this.items.filter(p=>p.Selected).length;
  }

  back(){
    this.events.publish('reloadWaitingReturn');
  }

}
