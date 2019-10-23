import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
@Component({
  selector: 'app-calculation-list',
  templateUrl: './calculation-list.page.html',
  styleUrls: ['./calculation-list.page.scss'],
})
export class CalculationListPage implements OnInit {
  calculateResultList:any;
  constructor(  private router: Router,private location: Location) { }

  ngOnInit() {
    this.calculateResultList=JSON.parse(localStorage.getItem("CalculationResult"));
  }
  goBack() {
    this.location.back();
  }
  detail(item){
    localStorage.setItem("CalculationDetail",JSON.stringify(item));
    this.router.navigateByUrl("/member/calculation/calculation-detail");
  }
}
