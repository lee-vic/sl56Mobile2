import { Component, OnInit } from '@angular/core';
import { DistributeService } from 'src/app/providers/distribute.service';
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-records',
  templateUrl: './records.page.html',
  styleUrls: ['./records.page.scss']
})
export class RecordsPage implements OnInit {

  constructor(private loadCtrl:LoadingController,private distributeService:DistributeService) { }

  records:any;
  ngOnInit(): void {
    this.loadCtrl.create({
      message:"数据加载中..."
    }).then(p=>{
      p.present();
      this.distributeService.getWithdrawalRecords().subscribe(res=>{
        this.records=res;
        this.loadCtrl.dismiss();
      });
    });
  }

}
