import { Component, OnInit } from '@angular/core';

import { Router } from '@angular/router';
@Component({
  selector: 'app-calculation-list',
  templateUrl: './calculation-list.page.html',
  styleUrls: ['./calculation-list.page.scss'],
})
export class CalculationListPage implements OnInit {
  calculateResultList:any;
  constructor(  private router: Router) { }

  ngOnInit() {
    this.calculateResultList=JSON.parse(localStorage.getItem("CalculationResult"));
  }
 
  detail(item){
    localStorage.setItem("CalculationDetail",JSON.stringify(item));
    this.router.navigateByUrl("/member/calculation/calculation-detail");
  }
}
