import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { apiUrl } from '../../../global';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-invoice-preview',
  templateUrl: './invoice-preview.page.html',
  styleUrls: ['./invoice-preview.page.scss']
})
export class InvoicePreviewPage implements OnInit {

  invoicePath:string;
  rgdId:number;
  problemId:number;
  
  constructor(private route:ActivatedRoute,private router:Router,private navCtrl:NavController) {
    this.route.queryParams.subscribe(p=>{
      this.rgdId=p.rgdId;
      this.problemId=p.problemId;
      let previewPath =apiUrl + "/Problem/PreviewInvoice?path=" +p.filePath+"#page=1";
      this.invoicePath=previewPath;
      console.log(previewPath);
    });
   }

  ngOnInit() {
  }

  reSelect(){
    let params:NavigationExtras = {
        queryParams:{
          problemid:this.problemId
        },
        state:{
          confirmFile:false,
          refresh:Date.now()
        }
    }
    console.log("confirm:false.goto:",'/member/problem-detail/'+this.rgdId,params);
    this.navCtrl.navigateBack('/member/problem-detail/'+this.rgdId,params)
  }
  confirm(){
    let params:NavigationExtras = {
        queryParams:{
          problemid:this.problemId
        },
        state:{
          confirmFile:true
        }
    }
    this.navCtrl.navigateBack('/member/problem-detail/'+this.rgdId,params)
  }

}
