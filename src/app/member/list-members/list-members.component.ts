import {Component, OnInit, ViewChild} from '@angular/core';
import {Member, MemberService} from "../member.service";
import {AuthService} from "../../auth/auth.service";
import {MatTableDataSource} from "@angular/material/table";
import {MatSort} from "@angular/material/sort";

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

  columns = ['name', 'email', 'current_status', 'functions', 'roles', 'entity', 'expa_id', 'profile'];
  selectedColumns = this.columns;

  functions: string[] = []
  roles: string[] = []
  entities: string[] = []

  filter = {
    quick_filter: "",
    functions: this.functions,
    roles: this.roles,
    entities: this.entities
  };


  constructor(public memberService: MemberService, private authService: AuthService) { }

  async ngOnInit() {
    if (!await this.authService.isLoggedIn()) await this.authService.login();

    this.members = await this.memberService.getMembers();
    console.log("Members:", this.members);

    this.dataSource = new MatTableDataSource<Member>(this.members);
    this.dataSource.sort = this.sort;
    this.dataSource.connect().subscribe(d => this.renderedData = d);
    this.getDisplayedColumns();

    this.functions  = this.getAllFunctions().sort();
    this.roles = this.getAllRoles().sort();
    this.entities = this.getAllEntities().sort();
  }

  getDisplayedColumns(): void {
    this.selectedColumns = ['name', 'email', 'current_status', 'functions', 'roles'];
    if (this.authService.getRole() == "admin") this.selectedColumns.push('entity');
    this.selectedColumns.push("expa_id");
    this.selectedColumns.push("profile");
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

  }

  private getAllFunctions(): string[] {
    let functions: string[] = [];
    for (const member of this.members) {
      for (const position of member.positions) {
        functions.push(position.function);
      }
    }

    return [...new Set(functions)];
  }

  private getAllRoles(): string[] {
    let roles: string[] = [];
    for (const member of this.members) {
      for (const position of member.positions) {
        roles.push(position.name);
      }
    }

    return [...new Set(roles)];
  }

  private getAllEntities(): string[] {
    let entities: string[] = [];
    for (const member of this.members) {
      for (const position of member.positions) {
        entities.push(position.entity);
      }
    }

    return [...new Set(entities)];
  }


}
