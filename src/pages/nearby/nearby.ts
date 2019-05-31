import { Component } from '@angular/core';
import {IonicPage, LoadingController, NavController, NavParams} from 'ionic-angular';
import {DatabaseService} from "../../services/database.service";

/**
 * Generated class for the NearbyPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-nearby',
  templateUrl: 'nearby.html',
})
export class NearbyPage {

  private databaseService: DatabaseService;
  private eventList: Array<Object>;
  constructor(
      private navCtrl: NavController,
      private navParams: NavParams,
      databaseService: DatabaseService,
      private loadingCtrl: LoadingController) {
    this.databaseService = databaseService;
    this.eventList = Array();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad NearbyPage');
    const loader = this.loadingCtrl.create({
      content: "Please wait..."
    });
    loader.present();
    this.databaseService.getAllEvents().then((res) => {
      let responseList = (res);
      for (let response of responseList) {
        this.eventList.push(
            {
              uid: response.uid,
              name: response.name,
              ownerUid: response.ownerUid,
              description: response.description,
              limit: response.limit,
              localization: response.localization,
              createDate: new Date(response.createDate),
              stopDate: new Date(response.stopDate),
              participants: response.participants,
            }
        );
      }
      loader.dismissAll();

    });
  }
}
