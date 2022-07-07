import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DistributeService } from 'src/app/providers/distribute.service';
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-profit',
  templateUrl: './profit.page.html',
  styleUrls: ['./profit.page.scss'],
  providers: [DatePipe]
})
export class ProfitPage implements OnInit {

  type: string = "今日";
  types = ["今日", "昨日", "本周", "本月", "本年"];
  profits: any;
  constructor(private distributeService: DistributeService, private datePipe: DatePipe,private loadingCtrl:LoadingController) { }

  ngOnInit(): void {
    this.loadingCtrl.create({
      message:"数据加载中..."
    }).then(p=>p.present());;
    this.distributeService.getProfits("今日").subscribe(res => {
      this.profits=res;
      this.loadingCtrl.dismiss();
    });
  }

  changeType(type) {
    this.type = type;
    this.loadingCtrl.create({
      message:"数据加载中..."
    }).then(p=>p.present());;
    this.distributeService.getProfits(type).subscribe(res => {
      this.profits=res;
      this.loadingCtrl.dismiss();
    });
  }

}
