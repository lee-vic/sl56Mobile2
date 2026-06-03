import { Component, OnInit } from '@angular/core';
import { DistributeService } from 'src/app/providers/distribute.service';

@Component({
  selector: 'app-records',
  templateUrl: './records.page.html',
  styleUrls: ['./records.page.scss']
})
export class RecordsPage implements OnInit {

  constructor(private distributeService:DistributeService) { }

  records:any;
  isLoading = true;

  ngOnInit(): void {
    this.isLoading = true;
    this.distributeService.getWithdrawalRecords().subscribe(res=>{
      this.records=res;
      this.isLoading = false;
    });
  }

}
