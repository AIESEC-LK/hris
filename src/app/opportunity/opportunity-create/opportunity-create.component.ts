import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MemberService } from "../../member/member.service";
import { AuthService } from "../../auth/auth.service";
import { ActivatedRoute, Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { LoadingComponent } from "../../dialogs/loading/loading.component";
import { ErrorComponent } from "../../dialogs/error/error.component";
import { Opportunity, OpportunityService } from "../opportunity.service";
import { Title } from "@angular/platform-browser";

@Component({
	selector: 'app-opportunity-create',
	templateUrl: './opportunity-create.component.html',
	styleUrls: ['./opportunity-create.component.css']
})
export class OpportunityCreateComponent implements OnInit {

	private url_regex = '(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?';

	form = new FormGroup({
		title: new FormControl(null, [Validators.required]),
		url: new FormControl(null, [Validators.required]),
		photo: new FormControl(null),
		photo_x: new FormControl(null, [Validators.required]),
		description: new FormControl(null, [Validators.required]),
		link: new FormControl(null, [Validators.pattern(this.url_regex)]),
		deadline: new FormControl(null, [Validators.required]),
		schedule: new FormControl(null, []),
		id: new FormControl(null)
	});

	formData = {
		photo: "",
		photo_file: null as null | File,
		cv: "",
		cv_file: null as null | File
	}

	photo: any;
	edit: boolean = false;

	constructor(private memberService: MemberService, private authService: AuthService, private router: Router,
		private dialog: MatDialog, public opportunityService: OpportunityService, private route: ActivatedRoute,
		private titleService: Title) {

		this.titleService.setTitle(`Create Opportunity | ASL 360°`);
		if (this.route.snapshot.paramMap.get("id")) {
			this.titleService.setTitle(`Edit Opportunity | ASL 360°`);
			this.edit = true;
		}

	}

	async ngOnInit() {
		if (!await this.authService.isLoggedIn()) await this.authService.login();

		if (this.edit) {
			try {
				const id = <string>this.route.snapshot.paramMap.get("id");
				const opportunity: Opportunity = await this.opportunityService.getOpportunity(id);
				this.form.setValue({
					title: opportunity.title,
					url: opportunity.id,
					description: opportunity.description,
					deadline: opportunity.deadline,
					schedule: opportunity.schedule,
					link: opportunity.link,
					photo: opportunity.photo,
					photo_x: "",
					id: id
				})
				this.formData.photo = opportunity.photo!;
				this.form.get("photo_x")?.clearValidators();
			} catch (e) {
				this.dialog.open(ErrorComponent, { data: e });
			}
		}
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

			let id;
			if (this.edit) id = await this.opportunityService.editOpportunity(this.form.value);
			else id = await this.opportunityService.createOpportunity(this.form.value);

			await this.router.navigate(["/opp/" + id]);
		} catch (e) {
			this.dialog.open(ErrorComponent, { data: e });
		} finally {
			loadingDialog.close();
		}
		return;
	}

	getShortUrl(): string {
		const value = this.form.value.url;
		return value == undefined ? '' : value.replace(/[^a-z0-9_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
	}

}
