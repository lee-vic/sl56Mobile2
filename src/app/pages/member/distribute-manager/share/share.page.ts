import { Component, OnInit, ViewChild } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { UserService } from 'src/app/providers/user.service';
import { DistributeService } from 'src/app/providers/distribute.service';

@Component({
  selector: 'app-share',
  templateUrl: './share.page.html',
  styleUrls: ['./share.page.scss']
})
export class SharePage implements OnInit {

  shareLink:string;
  codeBase64Str:string;
  constructor(
    private toastCtrl:ToastController,
    private userService:UserService,
    private distributeService:DistributeService
    ) { }
  @ViewChild("shareLink",{static:true}) link:any;
  ngOnInit(): void {
    this.userService.getHomeInfo().subscribe(res=>{
      this.shareLink= "https://mobile.sl56.com/distribute-register?code="+res.CustomerNo;
      this.link.nativeElement.value=this.shareLink;
      this.link.nativeElement.textContent=this.shareLink;
    });
    this.distributeService.getShareCode().subscribe(res=>{
      this.codeBase64Str=res;
    });
  }

  linkFocus(){
    this.link.nativeElement.select();
    document.execCommand("Copy");
    let toast = this.toastCtrl.create({
      message: "分享链接已复制",
      position: 'middle',
      duration: 3000
    }).then(p=>p.present());
  }
}
