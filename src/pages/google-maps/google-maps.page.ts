import { Component } from '@angular/core';
import { Geolocation } from '@ionic-native/geolocation';
import { IMarker, IPoint } from './interfaces';
import { AlertController, LoadingController } from 'ionic-angular';
import { DatabaseService } from '../../services/database.service';
import { UUID } from 'angular2-uuid';

import CustomEventWrapper from '../wrapers/event';
import User, { Status } from '../wrapers/user';

@Component({
	templateUrl: 'google-maps.html'
})
export class GoogleMapsPage {
	public origin: IPoint;
	public zoom: number;
	public events: CustomEventWrapper[];
	public ownEvents: CustomEventWrapper[] = new Array<CustomEventWrapper>();
	public joinedEvents: CustomEventWrapper[] = new Array<CustomEventWrapper>();
	public users: User[];
	public friends: User[];
	public currentUser: User[] = new Array<User>();
	public globalPosition;
	public loading;

	constructor(private geolocation: Geolocation, private alertCtrl: AlertController, private databaseService: DatabaseService, private loadingCtrl: LoadingController) {
		this.origin = {
			lat: 0,
			lng: 0
		};
		this.loading = this.createLoadingScreen();
		this.Init();
	}

	private async Init() {	
		this.loading.present();
		await this.initData();
		var position = await this.geolocation.getCurrentPosition();
		this.origin = {
			lat: position.coords.latitude,
			lng: position.coords.longitude
		};
		this.zoom = 10;
		this.loading.dismiss();
		console.log(this)
	}

	private async initData(): Promise<void> {
		await this.acquireData();
		await this.processMapData();
	}

	private async acquireData(){
		this.events = await this.databaseService.getAllEvents();
		this.friends = await this.getFriends();
		this.currentUser = new Array<User>();
		this.currentUser.push(await this.databaseService.getCurrentUserData())
		this.users = await this.getUsers();
	}

	private async getUsers(){
		var tempUsers = await this.databaseService.getAllUsers();
		return tempUsers.filter(user=> user.localization!=null);
	}

	private async getFriends(){
		var tempFriends = await this.databaseService.getAllFriendsData();
		return tempFriends.filter(user=> user.localization!=null);
	}

	placeMarker($event) {
		console.log($event.coords.lat);
		console.log($event.coords.lng);
		this.addEvent($event);
	}

	public clickedEvent(event: CustomEventWrapper) {
		let alert = this.alertCtrl.create({
			title: event.name,
			subTitle: "limit: " + event.limit + " zajęte: " + ((event.participants.size == undefined) ? 0 : event.participants.size),
			message: event.description,
			buttons: [
				{
					text: 'Anuluj',
					role: 'cancel',
					handler: data => {
					}
				},
				{
					text: 'Dołącz',
					handler: data => {
						console.log("limit: " + event.limit + " participantz size: " + event.participants.size)
						if(event.limit>event.participants.size || event.participants.size==undefined){
							this.databaseService.addParticipant(event.uid, this.currentUser[0].uid);
							this.events.map(eventTmp => {
								if(eventTmp.uid == event.uid){
									this.events.splice(this.events.indexOf(event), 1);
								}
							})
							this.joinedEvents.push(event);
						} else {
							this.alertCtrl.create({
								title: 'Brak miejsc',
								message: 'Brak dostępnych miejsc w wyznaczonym wydarzeniu',
								buttons: ['Ok']
							}).present()
						}
					}
				}
			]
		})
		alert.present();
	}

	public clickedOwnEvent(event: CustomEventWrapper) {
		let alert = this.alertCtrl.create({
			title: event.name,
			subTitle: "limit: " + event.limit + " zajęte: " + ((event.participants.size == undefined) ? 0 : event.participants.size),
			message: event.description,
			buttons: [
				{
					text: 'Anuluj',
					role: 'cancel',
					handler: data => {
					}
				},
				{
					text: 'Usuń',
					handler: data => {
						//todo: this.databaseService.deleteEvent(event.uid)
						this.ownEvents.map(ownEvent => {
							if(ownEvent.uid == event.uid){
								this.ownEvents.splice(this.ownEvents.indexOf(event), 1);
							}
						})
					}
				}
			]
		})
		alert.present();
	}

	public clickedUser(user: User) {
		let alert = this.alertCtrl.create({
			title: user.name + " " + user.surname,
			subTitle: "Status: " + user.status,
			message: user.description,
			buttons: [
				{
					text: 'Anuluj',
					role: 'cancel',
					handler: data => {
					}
				},
				{
					text: 'Dodaj do znajomych',
					handler: data => {
						this.databaseService.addFriend(user.uid);
						this.users.map(userObject => {
							if(userObject.uid == user.uid){
								this.users.splice(this.users.indexOf(userObject), 1);
							}
						})
						this.friends.push(user);
					}
				}
			]
		})
		alert.present();
	}

	public clickedFriend(user: User) {
		let alert = this.alertCtrl.create({
			title: user.name + " " + user.surname,
			subTitle: "Status: " + user.status,
			message: user.description,
			buttons: [
				{
					text: 'Anuluj',
					role: 'cancel',
					handler: data => {
					}
				},
				{
					text: 'Usuń ze znajomych',
					handler: data => {
						this.databaseService.deleteFriend(user.uid);
						this.friends.map(friend => {
							if(friend.uid == user.uid){
								this.friends.splice(this.friends.indexOf(friend), 1);
							}
						})
						this.users.push(user);
					}
				}
			]
		})
		alert.present();
	}

	public clickedJoinedEvent(event: CustomEventWrapper) {
		let alert = this.alertCtrl.create({
			title: event.name,
			subTitle: "limit: " + event.limit,
			message: event.description,
			buttons: [
				{
					text: 'Anuluj',
					role: 'cancel',
					handler: data => {
					}
				},
				{
					text: 'Wypisz się',
					handler: data => {
						this.databaseService.deleteParticipant(event.uid, this.currentUser[0].uid);
						this.joinedEvents.map(joinedEvent => {
							if(joinedEvent.uid == event.uid){
								this.joinedEvents.splice(this.joinedEvents.indexOf(event), 1);
							}
						})
						this.events.push(event);
					}
				}
			]
		})
		alert.present();
	}
	

	addEvent(event: any) {
		let alert = this.alertCtrl.create({
			title: 'Dodaj wydarzenie',
			inputs: [
				{
					name: 'nazwa',
					placeholder: 'Nazwa'
				},
				{
					name: 'opis',
					placeholder: 'opis'
				},
				{
					name: 'limit',
					placeholder: 'limit osób',
					type: 'number',
					min: 1
				}
			],
			buttons: [
				{
					text: 'Anuluj',
					role: 'cancel',
					handler: data => {
					}
				},
				{
					text: 'Dodaj',
					handler: data => {
						let customEvent = this.generateCustomEventWrapper(event, data);
						this.databaseService.createOrUpdateEvent(customEvent).then(() => this.ownEvents.push(event));
					}
				}
			]
		});
		alert.present();
	}

	generateCustomEventWrapper(event, data) {
		let customEvent = new CustomEventWrapper()
		customEvent.name = data.nazwa;
		customEvent.description = data.opis;
		customEvent.limit = data.limit;
		customEvent.createDate = new Date();
		customEvent.uid = UUID.UUID().toString();
		customEvent.participants = new Set<string>();
		customEvent.localization = {
			latitude: event.coords.lat,
			longitude: event.coords.lng
		}
		return customEvent;
	}

	private async processMapData(){
		await this.removeFriendsFromUsers();
		await this.removeCurrentUserFromUsers();
		await this.removeOwnEventsFromEvents();
	}

	private async removeFriendsFromUsers(){
		await this.friends.forEach(friend => {
			this.users.map(user => {
				if(user.uid == friend.uid){
					this.users.splice(this.users.indexOf(user), 1);
				}
			})
		});
	}

	private async removeCurrentUserFromUsers(){
		this.users.map(user => {
			if(user.uid == this.currentUser[0].uid){
				this.users.splice(this.users.indexOf(user), 1);
			}
		})
	}

	private async removeOwnEventsFromEvents(){
		this.ownEvents = this.isEventOwn();
		this.events = this.isEventNotOwn();
		this.prepareEventJoinedData();
	}

	private isEventOwn(){
		return this.events.filter(event => {
			return (event.ownerUid == this.currentUser[0].uid)
		})
	}

	private isEventNotOwn(){
		return this.events.filter(event => {
			return (event.ownerUid != this.currentUser[0].uid)
		})
	}

	private prepareEventJoinedData(){
		this.events.forEach(event => {
			event.participants.forEach(participant=> {
				if(participant == this.currentUser[0].uid){
					this.joinedEvents.push(event)
				}
			})
		}) 
		this.removeJoinedEventsFromEvents();
	}

	private removeJoinedEventsFromEvents(){
		this.events.map(event => {
			this.joinedEvents.map(joinedEvent => {
				if(event.uid == joinedEvent.uid){
					this.events.splice(this.events.indexOf(event), 1);
				}
			})	
		})
	}

	private createLoadingScreen(){
		return this.loadingCtrl.create({
            content: 'Trwa ładowanie mapy...'
		});
	}
}