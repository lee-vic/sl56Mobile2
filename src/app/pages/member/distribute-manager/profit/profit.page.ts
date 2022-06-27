import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DistributeService } from 'src/app/providers/distribute.service';

@Component({
  selector: 'app-profit',
  templateUrl: './profit.page.html',
  styleUrls: ['./profit.page.scss'],
  providers: [DatePipe]
})
export class ProfitPage implements OnInit {

  type: string = "今日";
  types = ["今日", "昨日", "本周", "本月", "历史"];
  profits: any;
  constructor(private distributeService: DistributeService, private datePipe: DatePipe) { }

  ngOnInit(): void {
    this.distributeService.getProfits("今日").subscribe(res => {
      this.profits=res;
    });
  }

  changeType(type) {
    this.type = type;
    switch (type) {
      case "今日":
        break;
      case "昨日":
        break;
      case "本周":
        break;
      case "本月":
        break;
    }
    this.distributeService.getProfits(type).subscribe(res => {
      this.profits=res;
    });
  }

}
