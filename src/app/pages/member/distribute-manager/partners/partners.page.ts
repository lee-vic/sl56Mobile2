import { Component, OnInit } from '@angular/core';
import { DistributeService } from 'src/app/providers/distribute.service';

@Component({
  selector: 'app-partners',
  templateUrl: './partners.page.html',
  styleUrls: ['./partners.page.scss']
})
export class PartnersPage implements OnInit {

  partners: any;
  roderType: "asc";
  allRows:any = [];
  constructor(private distributeService: DistributeService) { }

  ngOnInit(): void {
    this.distributeService.getPartners().subscribe(res => {
      console.log("partners:", res);
      this.partners = res;
      this.allRows=res.Rows;
    });
  }

  orderChange(e) {
    console.log(e);
    if (e.detail.value == "asc") {
      let ascResult = this.partners.Rows.sort((a, b) => {
        return parseInt(a.Id) - parseInt(b.Id)
      });
      console.log("asc:",ascResult);
    }else{
      let descResult = this.partners.Rows.sort((a, b) => {
        return parseInt(b.Id) - parseInt(a.Id)
      });
      console.log("desc:",descResult);
    }
  }

  search(e){
    console.log("searchText:",e.detail.value);
    if(e.detail.value==null || e.detail.value.length==0){
      this.partners.Rows=this.allRows;
    }else{
      let filtRows = this.allRows.filter(p=>p.CustomerName.indexOf(e.detail.value)!=-1);
      this.partners.Rows=filtRows;
    }
  }

}
