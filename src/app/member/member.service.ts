import { Injectable } from '@angular/core';
import { AngularFireFunctions } from "@angular/fire/compat/functions";
import { ErrorComponent } from "../dialogs/error/error.component";
import { MatDialog } from "@angular/material/dialog";
import { LoadingComponent } from "../dialogs/loading/loading.component";
import { Router } from "@angular/router";
import { AuthService } from "../auth/auth.service";
import { AngularFireStorage } from "@angular/fire/compat/storage";

const entities: string[] = [
	"COLOMBO CENTRAL",
	"COLOMBO NORTH",
	"COLOMBO SOUTH",
	"KANDY",
	"USJ",
	"NSBM",
	"Ruhuna",
	"SLIIT",
	"NIBM",
	"MC Sri Lanka"
];

export interface Member {
	name: string,
	email: string,
	expa_id: number,
	entity: string,
	phone: string,
	phone2: string,
	address: string,
	dob: string,
	joined_date: string,
	gender: string,
	positions: Position[],
	unofficial_positions: Position[],
	photo: string,
	cv: string,
	social_media: SocialMedia,
	current_status: CurrentStatus,
	tags: string[],
	faculty: string,
	field_of_study: string
	attachments: Attachment[],
}

export interface MemberManage {
	name: string,
	email: string,
	expa_id: number,
	entity: string,
	positions: Position[],
	unofficial_positions: Position[],
	isAdmin: boolean
}

export interface Position {
	name: string,
	start_date: string,
	end_date: string,
	function: string,
	entity: string
	type: string
}

export interface SocialMedia {
	facebook: string,
	instagram: string,
	linked_in: string
}

export enum CurrentStatus {
	ACTIVE = "ACTIVE",
	PROBATION = "PROBATION",
	TERMINATED = "TERMINATED",
	ALUMNI = "ALUMNI"
}

export interface Attachment {
	name: string,
	value: string
}

export interface MemberGroup {
	id: string,
	name: string,
	members: string[]
}

export interface GetGroupRequest {
	id: string
}

export interface DeleteGroupRequest {
	id: string
}

export interface CreateGroupRequest {
	name: string;
	members: string[];
}

export interface EditGroupRequest extends CreateGroupRequest {
	id: string
}

@Injectable({
	providedIn: 'root'
})
export class MemberService {

	constructor(private functions: AngularFireFunctions, private dialog: MatDialog, private router: Router,
		private authService: AuthService, private storage: AngularFireStorage) {
		//if (!environment.production) this.storage.storage.useEmulator('localhost', 9199);
	}

	public async getMemberInformation(email: string, refresh: boolean = false): Promise<Member> {
		const getMemberInformation = this.functions.httpsCallable('member-getProfileInformation');
		return await getMemberInformation({ email: email, refresh: refresh }).toPromise();
	}

	public async addAdditionalInformation(data: {}) {
		const loadingDialog = this.dialog.open(LoadingComponent);
		try {
			const addAdditionalInformation = this.functions.httpsCallable('member-addAdditionalInformation');
			await addAdditionalInformation(data).toPromise();
		} catch (e) {
			this.dialog.open(ErrorComponent, { data: e });
		}
		loadingDialog.close();
	}

	public async inviteMember(data: {}) {
		const loadingDialog = this.dialog.open(LoadingComponent);
		try {
			const inviteMember = this.functions.httpsCallable('member-inviteMember');
			await inviteMember(data).toPromise();
		} catch (e) {
			this.dialog.open(ErrorComponent, { data: e });
		}
		loadingDialog.close();
	}

	async changeCurrentStatus(member: Member, newStatus: CurrentStatus) {
		member.current_status = newStatus;
		try {
			const changeCurrentStatus = this.functions.httpsCallable('member-changeCurrentStatus');
			await changeCurrentStatus({
				email: member.email,
				current_status: member.current_status
			}).toPromise();
		} catch (e) {
			this.dialog.open(ErrorComponent, { data: e });
		}
	}

	canEdit(member: Member): boolean {
		return this.authService.isEBOrAbove() || this.authService.getEmail() == member.email;
	}

	async edit(member: Member, editField: string, newValue: any) {
		try {
			const editProfileField = this.functions.httpsCallable('member-editProfileField');
			await editProfileField({
				email: member.email,
				editField: editField,
				newValue: newValue
			}).toPromise();
			// @ts-ignore
			MemberService.changeField(member, editField, newValue);
			console.log(member);
		} catch (e) {
			this.dialog.open(ErrorComponent, { data: e });
		}
	}

	async uploadFile(file: File): Promise<string> {
		const fileName = Date.now().toString() + "_" + file.name;
		const ref = this.storage.ref(fileName);
		const x = await ref.put(file);
		console.log("X", x);
		return fileName;
	}

	public async getMembers(): Promise<Member[]> {
		const getMembers = this.functions.httpsCallable('member-getMembers');
		return await getMembers({}).toPromise();
	}

	public async getMembersManage(): Promise<MemberManage[]> {
		const getMembers = this.functions.httpsCallable('member-getMembersManage');
		return <MemberManage[]>await getMembers({}).toPromise();
	}


	private static changeField(member: Member, path: string, value: string) {
		var schema = member;  // a moving reference to internal objects within obj
		var pList = path.split('.');
		var len = pList.length;
		for (var i = 0; i < len - 1; i++) {
			var elem = pList[i];
			// @ts-ignore
			if (!schema[elem]) schema[elem] = {}
			// @ts-ignore
			schema = schema[elem];
		}

		// @ts-ignore
		schema[pList[len - 1]] = value;
	}

	public getCurrentFunctions(member: Member): string[] {
		let functions: string[] = [];

		const today: Date = new Date();
		for (let position of this.getPositions(member)) {
			const end_date: Date = new Date(Date.parse(position.end_date));
			if (end_date < today) continue;
			functions.push(MemberService.replaceCommonFunctionNames(position.function));
		}

		return [...new Set(functions)];
	}

	public getCurrentRoles(member: Member): string[] {
		let roles: string[] = [];

		const today: Date = new Date();
		for (let position of this.getPositions(member)) {
			const end_date: Date = new Date(Date.parse(position.end_date));
			if (end_date < today) continue;
			if (!position.name || position.name == null) continue;
			roles.push(position.name.trim());
		}
		return [...new Set(roles)];
	}

	public getCurrentEntities(member: Member | MemberManage): string[] {
		let entities: string[] = [];

		const today: Date = new Date();
		for (let position of this.getPositions(member)) {
			const end_date: Date = new Date(Date.parse(position.end_date));
			if (end_date < today) continue;
			if (!position.entity) continue;
			entities.push(position.entity.trim());
		}

		if (!member.entity) return [];
		if (entities.length == 0) entities.push(member.entity.trim());

		return [...new Set(entities)];
	}

	public async deleteTag(member: Member, tag: string): Promise<void> {
		member.tags = member.tags.filter(item => item !== tag);
		await this.edit(member, "tags", member.tags);
	}

	public async addTag(member: Member, tag: string): Promise<void> {
		if (member.tags == null) member.tags = [tag];
		else member.tags.unshift(tag);
		await this.edit(member, "tags", member.tags);
	}

	public async addAttachment(member: Member, attachment: Attachment): Promise<void> {
		if (member.attachments == null) member.attachments = [attachment];
		else member.attachments.push(attachment);
		await this.edit(member, "attachments", member.attachments);
	}

	public async deleteAttachment(member: Member, attachment: Attachment): Promise<void> {
		member.attachments = member.attachments.filter(item => item !== attachment);
		await this.edit(member, "attachments", member.attachments);
	}

	public async addPosition(member: Member, position: Position): Promise<void> {
		if (member.unofficial_positions == null) member.unofficial_positions = [position];
		else member.unofficial_positions.push(position);
		await this.edit(member, "unofficial_positions", member.unofficial_positions);
	}

	public getPositions(member: Member | MemberManage): Position[] {
		let positions: Position[] = [];
		if (member.positions != null) {
			for (const position of member.positions) {
				position.type = "official";
				if (!position.name && position.name != null) position.name = position.name.trim();
				positions.push(position);
			}
		}
		if (member.unofficial_positions != null) {
			for (const position of member.unofficial_positions) {
				position.type = "unofficial";
				if (!position.name && position.name != null) position.name = position.name.trim();
				positions.push(position);
			}
		}

		positions.sort(function (a, b) {
			var keyA = new Date(a.start_date),
				keyB = new Date(b.start_date);
			// Compare the 2 dates
			if (keyA < keyB) return 1;
			if (keyA > keyB) return -1;
			return 0;
		});

		return positions;
	}

	public async deletePosition(member: Member, position: Position): Promise<void> {
		member.unofficial_positions = member.unofficial_positions.filter(item => item !== position);
		await this.edit(member, "unofficial_positions", member.unofficial_positions);
	}

	public static replaceCommonFunctionNames(function_name: string) {
		if (!function_name) return function_name;
		let x = function_name.trim();
		const abbrv = {
			"Incoming Global Volunteer": "iGV",
			"Incoming Global Talent/Teacher": "iGTa/e",
			"Outgoing Global Talent/Teacher": "oGTa/e",
			"Incoming Global Talent and Teacher": "iGTa/e",
			"Outgoing Global Talent and Teacher": "oGTa/e",
			"Incoming Global Talent & Teacher": "iGTa/e",
			"Outgoing Global Talent & Teacher": "oGTa/e",
			"Incoming Global Talent&Teacher": "iGTa/e",
			"Outgoing Global Talent&Teacher": "oGTa/e",
			"oGTa/Te": "oGTa/e",
			"iGTa/Te": "iGTa/e",
			"Incoming Global Talent": "iGTa",
			"Incoming Global Teacher": "iGTe",
			"Outgoing Global Volunteer": "oGV",
			"Outgoing Global Talent": "oGTa",
			"Outgoing Global Teacher": "oGTe",
			"Business Development": "BD",
			"Partnership Development": "PD",
			"People Management": "PM",
			"Talent Management": "TM",
			"Information Management": "IM",
			"Finance & Legal": "F&L",
			"Finance, Legal": "FL",
			"Expansions Development": "ED",
			"Digital Experience": "DXP",
			"DigitalExperience": "DXP",
			"Engage with AIESEC": "EwA",
			"EWA": "EwA",
			"Business to Customer": "B2C",
			"Business to Business": "B2B",
			"Marketing": "Mkt",
			" and ": " & ",
			"Organizing Committee": "OC",
			"Customer Experience": "CXP",
			"Expansion Management": "EM",
			"Expansions Management": "EM",
			"Entity Development": "ED",
			"Organizational Development": "OD",
			"Outgoing Exchanges": "oGX",
			"Outgoing Exchange": "oGX",
			"Incoming Exchanges": "iCX",
			"Incoming Exchange": "iCX",
			"Public Relations": "PR",
			"School Expansion Board": "SEB",
			"International Relations": "IR",
			"Matching": "M"
		}

		for (const long_form in abbrv) {
			let regEx = new RegExp(long_form, "ig");
			// @ts-ignore
			const replaceMask: string = abbrv[long_form];
			x = x.replace(regEx, replaceMask);
		}
		return x;
	}

	public getAllEntities(): string[] {
		return entities;
	}

	public async makeEB(member: MemberManage) {
		const makeEB = this.functions.httpsCallable('member-makeEB');
		return await makeEB({ email: member.email }).toPromise();
	}

	public async revokeEB(member: MemberManage) {
		const revokeEB = this.functions.httpsCallable('member-revokeEB');
		return await revokeEB({ email: member.email }).toPromise();
	}

	public async getGroup(id: string): Promise<MemberGroup> {
		const getGroup = this.functions.httpsCallable('member-getGroup');
		const data: GetGroupRequest = {
			id: id
		};
		return await getGroup(data).toPromise();
	}

	public async getGroups(): Promise<MemberGroup[]> {
		const getGroups = this.functions.httpsCallable('member-getGroups');
		return await getGroups({}).toPromise();
	}

	public async createGroup(data: CreateGroupRequest) {
		const createGroup = this.functions.httpsCallable('member-createGroup');
		return await createGroup(data).toPromise();
	}

	public async editGroup(data: EditGroupRequest) {
		const editGroup = this.functions.httpsCallable('member-editGroup');
		return await editGroup(data).toPromise();
	}

	public async deleteGroup(id: string): Promise<string> {
		const deleteGroup = this.functions.httpsCallable('member-deleteGroup');
		const data: DeleteGroupRequest = {
			id: id
		}
		return await deleteGroup(data).toPromise();
	}

}
