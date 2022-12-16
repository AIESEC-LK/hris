import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MemberService, CreateGroupRequest, MemberGroup } from "../../../member/member.service";
import { AuthService } from "../../../auth/auth.service";
import { ActivatedRoute, Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { LoadingComponent } from "../../../dialogs/loading/loading.component";
import { ErrorComponent } from "../../../dialogs/error/error.component";
import { Title } from "@angular/platform-browser";

@Component({
	selector: 'app-create-group',
	templateUrl: './create-group.component.html',
	styleUrls: ['./create-group.component.css']
})
export class CreateGroupComponent implements OnInit {

	private email_list_regex = /^(([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5}){1,25})+([;, \n](([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5}){1,25})+)*$/;

	form = new FormGroup({
		id: new FormControl(null),
		name: new FormControl(null, [Validators.required]),
		members: new FormControl(null, [Validators.required, Validators.pattern(this.email_list_regex)]),
	});

	edit: boolean = false;
	errorList: string[] = [];

	constructor(private memberService: MemberService, private authService: AuthService, private router: Router, private dialog: MatDialog, private route: ActivatedRoute, private titleService: Title) {

		this.titleService.setTitle(`Create Group | ASL 360°`);
		if (this.route.snapshot.paramMap.get("id")) {
			this.titleService.setTitle(`Edit Group | ASL 360°`);
			this.edit = true;
		}

	}

	async ngOnInit() {
		if (!await this.authService.isLoggedIn()) await this.authService.login();

		if (this.edit) {
			try {
				const id: string = <string>this.route.snapshot.paramMap.get("id");
				const group: MemberGroup = await this.memberService.getGroup(id);
				this.form.setValue({
					id: group.id,
					name: group.name,
					members: group.members.join("\n"),
				})
			} catch (e) {
				this.dialog.open(ErrorComponent, { data: e });
			}
		}
	}

	async submitForm() {
		let loadingDialog = this.dialog.open(LoadingComponent);
		try {
			if (!this.form.valid) throw "There was an error with your form";

			let id;
			if (this.edit) {
				id = await this.memberService.editGroup({
					id: this.form.value.id,
					name: this.form.value.name,
					members: this.form.value.members.split("\n")
				});
			}
			else {
				id = await this.memberService.createGroup({
					name: this.form.value.name,
					members: this.form.value.members.split("\n")
				});
			}

			await this.router.navigate(["/members/groups"]);
		} catch (e) {
			this.dialog.open(ErrorComponent, { data: e });
		} finally {
			loadingDialog.close();
		}
		return;
	}

	validateMembers() {
		this.errorList = [];
		const memberList: string[] = this.form.value.members.split("\n");
		for (let member of memberList) {
			member = member.trim();
			if (!this.validateEmail(member)) this.errorList.push(`Invalid email address: ${member}`);
		}
	}


	private validateEmail(email: string) {
		var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test(email);
	}


}
