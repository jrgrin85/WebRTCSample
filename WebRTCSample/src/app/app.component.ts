import { Component, OnInit } from '@angular/core';
declare const videoChat: any;
//declare const mytest: any;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  title = 'app';
  username = "";
  ngOnInit(){
    videoChat.load();
    //mytest.runTest();
  }

  logIn(_username){
    this.username = _username;
    console.log(_username);
    console.log(this.username);
    videoChat.logIn();
  }

  callUser(){
    videoChat.callUser();
  }

  hangUp(){
    videoChat.hangUp();
  }
}
