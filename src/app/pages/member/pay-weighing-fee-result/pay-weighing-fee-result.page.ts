import { WeightBillService } from 'src/app/providers/weight-bill.service';
import { ActivatedRoute } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { apiUrl } from 'src/app/global';

@Component({
  selector: "app-pay-weighing-fee-result",
  templateUrl: "./pay-weighing-fee-result.page.html",
  styleUrls: ["./pay-weighing-fee-result.page.scss"],
})
export class PayWeighingFeeResultPage implements OnInit {
  id;
  downloadLink;
  imageUrl:string;
  constructor(private route: ActivatedRoute, private service: WeightBillService) {
    this.id = this.route.snapshot.paramMap.get("id");
  }

  ngOnInit(): void {
    this.imageUrl = apiUrl + "/Measure/GetWeightBillFile?objectId=" + this.id;
  }
}
