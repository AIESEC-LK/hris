import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MemberService } from "../../member/member.service";
import { AuthService } from "../../auth/auth.service";
import { Router } from "@angular/router";
import { LoadingComponent } from "../../dialogs/loading/loading.component";
import { MatDialog } from "@angular/material/dialog";
import { ErrorComponent } from "../../dialogs/error/error.component";

@Component({
	selector: 'app-initialize',
	templateUrl: './initialize.component.html',
	styleUrls: ['./initialize.component.css']
})
export class InitializeComponent implements OnInit {

	private url_regex = '(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?';

	form = new FormGroup({
		field_of_study: new FormControl(null, [Validators.required]),
		photo: new FormControl(null),
		photo_x: new FormControl(null, [Validators.required]),
		cv: new FormControl(null),
		cv_x: new FormControl(null),
		expa_email: new FormControl(null, [Validators.email]),
		phone: new FormControl(null),
		phone2: new FormControl(null),
		address: new FormControl(null),
		facebook: new FormControl(null, [Validators.pattern(this.url_regex)]),
		instagram: new FormControl(null, [Validators.pattern(this.url_regex)]),
		linked_in: new FormControl(null, [Validators.pattern(this.url_regex)])
	});

	formData = {
		photo: "",
		photo_file: null as null | File,
		cv: "",
		cv_file: null as null | File
	}

	photo: any;

	constructor(private memberService: MemberService, private authService: AuthService, private router: Router,
		private dialog: MatDialog) { }

	async ngOnInit() {
		if (!await this.authService.isLoggedIn()) await this.authService.login();
	}

	async submitForm2() {
		await this.memberService.addAdditionalInformation(this.form.value);
		await this.router.navigate(["/profile"]);
	}

	getImageUrl(): string {
		if (this.photo) return this.photo;
		return "https://i.pinimg.com/originals/fd/14/a4/fd14a484f8e558209f0c2a94bc36b855.png";
	}

	onFileSelected(event: any, name: string) {
		const file: File = event.target.files[0];
		// @ts-ignore
		this.formData[name + "_file"] = file;
		if (file) {
			// @ts-ignore
			this.formData[name] = file.name;
		}
		if (this.form.get("photo_x")?.value != null) {
			const reader = new FileReader();

			const x = this;
			reader.onload = function (e) {
				x.photo = e.target!.result;
			};

			reader.readAsDataURL(this.formData.photo_file!);
		}
	}

	async submitForm() {
		let loadingDialog = this.dialog.open(LoadingComponent);
		try {
			if (!this.form.valid) throw "There was an error with your form";

			let fileName: string = "";
			if (this.formData.cv_file != null) fileName = await this.memberService.uploadFile(<File>this.formData.cv_file);
			this.form.get("cv")?.setValue(fileName);

			if (this.formData.photo_file != null) fileName = await this.memberService.uploadFile(<File>this.formData.photo_file);
			this.form.get("photo")?.setValue(fileName);

			this.form.removeControl("photo_x");
			this.form.removeControl("cv_x");

			this.form.addControl("social_media", new FormControl(null));
			this.form.get("social_media")?.setValue({
				facebook: this.form.get("facebook")?.value,
				instagram: this.form.get("instagram")?.value,
				linked_in: this.form.get("linked_in")?.value,
			});

			await this.memberService.addAdditionalInformation(this.form.value);
		} catch (e) {
			this.dialog.open(ErrorComponent, { data: e });
		} finally {
			loadingDialog.close();
			await this.router.navigate(["/profile"]);
		}
		return;
	}



}
