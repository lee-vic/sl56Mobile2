import { Component, OnInit } from '@angular/core';
import { ProblemService } from 'src/app/providers/problem.service';
import { NavController, NavParams } from '@ionic/angular';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';

@Component({
  selector: 'app-problem-detail',
  templateUrl: './problem-detail.page.html',
  styleUrls: ['./problem-detail.page.scss'],
})
export class ProblemDetailPage implements OnInit {

  receiveGoodsDetailId:Number;
  problemId:Number;
  data:any;
  ngOnInit(): void {
    this.service.getProblemDetail(this.problemId).subscribe(res => {
      this.data=res;
      console.log(this.data);
    });
  }

  constructor(public navCtrl: NavController,
    private route: ActivatedRoute,
    public service: ProblemService,
    private router: Router,
    ) {
      this.problemId=this.route.snapshot.queryParams.problemid;
     this.receiveGoodsDetailId=new Number(this.route.snapshot.paramMap.get("id")); 
      //this.receiveGoodsDetailId=navParams.get("id");
      //this.problemId=navParams.get("problemId");
      console.log(this.receiveGoodsDetailId);
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ProblemDetailPage');
  }

  chat(){
    let extras:NavigationExtras={
      state:{
        receiveGoodsDetailId: this.data.Id,
        problemId:this.data.Problem.ObjectId,
       messages:this.data.ChatRecords,
       attachmentTypeId:this.data.Problem.AttachmentTypeId
      }
    }
    this.router.navigate(["/member/chat/2"],extras)
  }

}
