import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NavController} from 'ionic-angular';
import { AuthService } from '../../services/auth.service';
import { SignupPage } from '../signup/signup';
import { GoogleMapsPage } from '../google-maps/google-maps.page';

@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage {
	loginForm: FormGroup;
	loginError: string;

	constructor(
		private navCtrl: NavController,
		private auth: AuthService,
		fb: FormBuilder
	) {
		this.loginForm = fb.group({
			email: ['', Validators.compose([Validators.required, Validators.email])],
			password: ['', Validators.compose([Validators.required, Validators.minLength(6)])]
		});
	}

  login() {
		let data = this.loginForm.value;

		if (!data.email) {
			return;
		}

		let credentials = {
			email: data.email,
			password: data.password
		};
		this.auth.signInWithEmail(credentials)
			.then(
				() => this.navCtrl.setRoot(GoogleMapsPage),
				error => this.loginError = error.message
			);
    }

  signup(){
    this.navCtrl.push(SignupPage);
  }

  loginWithGoogle() {
  this.auth.signInWithGoogle()
    .then(
      () => this.navCtrl.setRoot(GoogleMapsPage),
      error => console.log(error.message)
    );
  }

}
