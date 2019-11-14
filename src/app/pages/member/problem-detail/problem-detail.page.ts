import { Component, OnInit } from '@angular/core';
import { ProblemService } from 'src/app/providers/problem.service';
import { NavController, NavParams } from '@ionic/angular';

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
    public navParams: NavParams,
    public service: ProblemService,
    ) {
     
      this.receiveGoodsDetailId=navParams.get("id");
      this.problemId=navParams.get("problemId");
      console.log(this.receiveGoodsDetailId);
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ProblemDetailPage');
  }

  chat(){
    // this.navCtrl.push(UserChatPage, {
    //   receiveGoodsDetailId: this.data.Id,
    //   problemId:this.data.Problem.ObjectId,
    //   messages:this.data.ChatRecords,
    //   messageType:2,
    //   attachmentTypeId:this.data.Problem.AttachmentTypeId
    // });
  }

}
