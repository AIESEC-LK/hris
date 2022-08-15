import {Component, OnInit, ViewChild} from '@angular/core';
import {Member, MemberService} from "../member.service";
import {AuthService} from "../../auth/auth.service";
import {MatTableDataSource} from "@angular/material/table";
import {MatSort} from "@angular/material/sort";
import {ErrorComponent} from "../../dialogs/error/error.component";
import {MatDialog} from "@angular/material/dialog";
import { MatTableExporterDirective } from 'mat-table-exporter';
import {Title} from "@angular/platform-browser";

@Component({
  selector: 'app-list-members',
  templateUrl: './list-members.component.html',
  styleUrls: ['./list-members.component.css']
})
export class ListMembersComponent implements OnInit {

  public members: Member[] = [];

  // @ts-ignore
  @ViewChild(MatSort) sort: MatSort;
  dataSource = new MatTableDataSource(this.members);
  renderedData: any;

  columns = ['name', 'email', 'current_status', 'functions', 'roles', 'entity', 'gender', 'address', 'phone', 'phone2',
    'dob', 'expa_id', 'tags', 'faculty', 'profile'];
  selectedColumns = this.columns;

  functions: string[] = []
  roles: string[] = []
  entities: string[] = []
  faculties: string[] = []
  tags: string[] = []

  filter = {
    quick_filter: "",
    functions: this.functions,
    roles: this.roles,
    entities: this.entities,
    faculties: this.faculties,
    tags: this.tags
  };

  @ViewChild(MatTableExporterDirective) matTableExporter?: MatTableExporterDirective;

  constructor(public memberService: MemberService, public authService: AuthService, private dialog:MatDialog,
    private titleService:Title) {
      this.titleService.setTitle("Members | ASL 360°");
    }

  async ngOnInit() {
    if (!await this.authService.isLoggedIn()) await this.authService.login();

    try {
      this.members = await this.memberService.getMembers();
      console.log("Members:", this.members);

      this.dataSource = new MatTableDataSource<Member>(this.members);
      this.dataSource.sort = this.sort;
      this.dataSource.connect().subscribe(d => this.renderedData = d);
      this.getDisplayedColumns();

      this.functions  = this.getAllFunctions().sort();
      this.roles = this.getAllRoles().sort();
      this.entities = this.getAllEntities().sort();
      this.faculties = this.getAllFaculties().sort();
      this.tags = this.getAllTags().sort();
    } catch (e) {
      this.dialog.open(ErrorComponent, {data: e});
    }

  }

  getDisplayedColumns(): void {
    this.selectedColumns = ['name', 'current_status', 'functions', 'roles', 'faculty'];
    if (this.authService.isAdmin()) this.selectedColumns.push('entity');
    this.selectedColumns.push("expa_id");
    this.selectedColumns.push("profile");

    if (window.innerWidth < 960) this.selectedColumns = ['name', 'profile'];
  }

  public doFilter() {
    this.dataSource.data = this.members;
    this.dataSource.filter = this.filter.quick_filter.trim().toLocaleLowerCase();

    //Filter by function
    const filter_functions = this.filter.functions;
    if (filter_functions.length > 0) {
      this.dataSource.data = this.dataSource.data.filter(e=> {
        const functions = this.memberService.getCurrentFunctions(e);
        return filter_functions.some(item => functions.includes(item))
      });
    }

    //Filter by role
    const filter_roles = this.filter.roles;
    if (filter_roles.length > 0) {
      this.dataSource.data = this.dataSource.data.filter(e=> {
        const roles = this.memberService.getCurrentRoles(e);
        return filter_roles.some(item => roles.includes(item))
      });
    }

    //Filter by entity
    const filter_entities = this.filter.entities;
    if (filter_entities.length > 0) {
      this.dataSource.data = this.dataSource.data.filter(e=> {
        const entities = this.memberService.getCurrentEntities(e);
        return filter_entities.some(item => entities.includes(item))
      });
    }

    //Filter by faculty
    const filter_faculties = this.filter.faculties;
    if (filter_faculties.length > 0) {
      this.dataSource.data = this.dataSource.data.filter(e=> {
        const faculty = e.faculty;
        return filter_faculties.includes(faculty);
      });
    }

    //Filter by tag
    const filter_tags = this.filter.tags;
    if (filter_tags.length > 0) {
      this.dataSource.data = this.dataSource.data.filter(e=> {
        const tags = e.tags;
        if (tags == null) return false;
        return filter_tags.some(item => tags.includes(item))
      });
    }
  }

  private getAllFunctions(): string[] {
    let functions: string[] = [];
    for (const member of this.members) {
      for (const function_name of this.memberService.getCurrentFunctions(member)) {
        const fixedName = MemberService.replaceCommonFunctionNames(function_name);
        if (!fixedName || fixedName.trim() == "") continue; 
        functions.push(fixedName);
      }
    }

    return [...new Set(functions)];
  }

  private getAllRoles(): string[] {
    let roles: string[] = [];
    for (const member of this.members) {
      for (const position of this.memberService.getCurrentRoles(member)) {
        roles.push(position);
      }
    }

    return [...new Set(roles)];
  }

  private getAllEntities(): string[] {
    let entities: string[] = [
      "COLOMBO CENTRAL",
      "COLOMBO NORTH",
      "COLOMBO SOUTH",
      "Kandy",
      "USJ",
      "NSBM",
      "Ruhuna",
      "SLIIT",
      "MC Sri Lanka"
    ];
    return entities;

    /*
    for (const member of this.members) {
      for (const entity of this.memberService.getCurrentEntities(member)) {
        entities.push(entity);
      }
    }
    return [...new Set(entities)];
    */
  }

  private getAllFaculties(): string[] {
    let faculties: string[] = [];
    for (const member of this.members) {
        faculties.push(member.faculty);
    }
    return [...new Set(faculties)];
  }

  export() {
    this.matTableExporter?.exportTable('csv', {fileName:'members'});
  }

  private getAllTags(): string[] {
    let tags: string[] = [];
    for (const member of this.members) {
      if (member.tags == null) continue;
      for (const tag of member.tags) {
        tags.push(tag);
      }
    }

    return [...new Set(tags)];
  }

  truncate(str: string, n: number){
    return (str.length > n) ? str.substr(0, n-1) + '...' : str;
  };



}
