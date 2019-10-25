import { Component, OnInit } from '@angular/core';


@Component({
  selector: 'app-calculation-detail',
  templateUrl: './calculation-detail.page.html',
  styleUrls: ['./calculation-detail.page.scss'],
})
export class CalculationDetailPage implements OnInit {
  data:any;
  tab="1";
  constructor( ) { }

  ngOnInit() {
    this.data=JSON.parse(localStorage.getItem("CalculationDetail"));
  }
 
}
