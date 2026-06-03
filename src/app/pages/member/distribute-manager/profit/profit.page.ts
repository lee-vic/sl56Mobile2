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
  types = ["今日", "昨日", "本周", "本月", "本年"];
  profits: any;
  isLoading = true;

  constructor(private distributeService: DistributeService, private datePipe: DatePipe) { }

  ngOnInit(): void {
    this.isLoading = true;
    this.distributeService.getProfits("今日").subscribe(res => {
      this.profits=res;
      this.isLoading = false;
    });
  }

  changeType(type) {
    this.type = type;
    this.isLoading = true;
    this.distributeService.getProfits(type).subscribe(res => {
      this.profits=res;
      this.isLoading = false;
    });
  }

}
