import { FadadaService } from './../../../providers/fadada.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FaDaDaAuthResult } from 'src/app/interfaces/fadada-auth-result';

@Component({
  selector: 'app-auth-result',
  templateUrl: './auth-result.page.html',
  styleUrls: ['./auth-result.page.scss']
})
export class AuthResultPage implements OnInit {

  constructor(public route:ActivatedRoute,public service: FadadaService) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(res => { 
      let faDaDaAuthResult = new FaDaDaAuthResult(res)
      console.log("authResult:", faDaDaAuthResult)
      this.service.submitAuthResult(faDaDaAuthResult).subscribe(res => { 
        console.log("authResult submit:", res)
      });
    });
  }

}
