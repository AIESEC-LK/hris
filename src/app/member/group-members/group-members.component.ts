import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { AuthService } from 'src/app/auth/auth.service';
import { ErrorComponent } from 'src/app/dialogs/error/error.component';
import { LoadingComponent } from 'src/app/dialogs/loading/loading.component';
import { ViewGroupDialogComponent } from 'src/app/dialogs/view-group-dialog/view-group-dialog.component';
import { MemberService, MemberGroup } from '../member.service';

@Component({
	selector: 'app-group-members',
	templateUrl: './group-members.component.html',
	styleUrls: ['./group-members.component.css']
})
export class GroupMembersComponent implements OnInit {

	groups: MemberGroup[] = [];
	dataSource = new MatTableDataSource(this.groups);
	selectedColumns: string[] = ["name", "count", "view", "edit", "delete"];
	filter = {
		name: "",
		members: "",
	};
	protectedGroups: string[] = ["ActiveMembers"];

	constructor(public authService: AuthService, private memberService: MemberService, private dialog: MatDialog) { }

	async ngOnInit(): Promise<void> {
		if (!await this.authService.isLoggedIn()) await this.authService.login();

		try {
			this.groups = await this.memberService.getGroups();
			if (this.groups.length == 0) {
				throw Error("No groups available.");
			}

			this.dataSource = new MatTableDataSource<MemberGroup>(this.groups);
		} catch (e) {
			this.dialog.open(ErrorComponent, { data: e });
		}
	}

	public doFilter() {
		this.dataSource.data = this.groups;

		this.dataSource.data = this.dataSource.data.filter(e => {
			return e.name.trim().toLocaleLowerCase().includes(this.filter.name.trim().toLocaleLowerCase());
		});

		this.dataSource.data = this.dataSource.data.filter(e => {
			return e.members.join(",").trim().toLocaleLowerCase().includes(this.filter.members.trim().toLocaleLowerCase());
		});

	}

	public viewMembers(group: MemberGroup) {
		this.dialog.open(ViewGroupDialogComponent, { data: group });
	}

	async delete(group: MemberGroup) {
		let loadingDialog = this.dialog.open(LoadingComponent);
		try {
			await this.memberService.deleteGroup(group.id);
			this.groups = this.groups?.filter(item => item !== group)
			this.dataSource = new MatTableDataSource<MemberGroup>(this.groups);
		} catch (e) {
			this.dialog.open(ErrorComponent, { data: e });
		} finally {
			loadingDialog.close();
		}
		return;
	}

}
