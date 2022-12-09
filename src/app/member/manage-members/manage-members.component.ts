import {Component, OnInit, ViewChild} from '@angular/core';
import {MemberManage, MemberService} from "../member.service";
import {AuthService} from "../../auth/auth.service";
import {MatTableDataSource} from "@angular/material/table";
import {MatSort} from "@angular/material/sort";
import {ErrorComponent} from "../../dialogs/error/error.component";
import {MatDialog} from "@angular/material/dialog";
import { MatTableExporterDirective } from 'mat-table-exporter';
import {Title} from "@angular/platform-browser";
import {LoadingComponent} from "../../dialogs/loading/loading.component";

@Component({
  selector: 'app-list-members',
  templateUrl: './manage-members.component.html',
  styleUrls: ['./manage-members.component.css']
})
export class ManageMembersComponent implements OnInit {

  public members: MemberManage[] = [];

  // @ts-ignore
  @ViewChild(MatSort) sort: MatSort;
  dataSource = new MatTableDataSource(this.members);
  renderedData: any;

  columns = ['name', 'email', 'expa_id', 'isAdmin'];
  selectedColumns = this.columns;

  entities: string[] = []

  filter = {
    quick_filter: "",
    entities: this.entities,
    isAdmin: ["true"],
  };

  constructor(public memberService: MemberService, public authService: AuthService, private dialog:MatDialog,
    private titleService:Title) {
      this.titleService.setTitle("Manage Members | ASL 360°");
  }

  async ngOnInit() {
    if (!await this.authService.isLoggedIn()) await this.authService.login();

    try {
      this.members = await this.memberService.getMembersManage();
      console.log("Members:", this.members);

      this.dataSource = new MatTableDataSource<MemberManage>(this.members);
      this.dataSource.sort = this.sort;
      this.dataSource.connect().subscribe(d => this.renderedData = d);
      this.getDisplayedColumns();

      this.entities = this.memberService.getAllEntities();
      this.doFilter();
    } catch (e) {
      this.dialog.open(ErrorComponent, {data: e});
    }

  }

  getDisplayedColumns(): void {
    this.selectedColumns = ['name', 'email'];
    if (this.authService.isAdmin()) this.selectedColumns.push('entity');
    this.selectedColumns.push("expa_id");
    this.selectedColumns.push("isAdmin");
  }

  public doFilter() {
    this.dataSource.data = this.members;
    this.dataSource.filter = this.filter.quick_filter.trim().toLocaleLowerCase();

    //Filter by entity
    const filter_entities = this.filter.entities;
    if (filter_entities.length > 0) {
      this.dataSource.data = this.dataSource.data.filter(e=> {
        const entities = this.memberService.getCurrentEntities(e);
        return filter_entities.some(item => entities.includes(item))
      });
    }

    //Filter by isAdmin
    const filterIsAdmin = this.filter.isAdmin;
    if (filterIsAdmin.length > 0) {
      this.dataSource.data = this.dataSource.data.filter(e=> {
        return filterIsAdmin.some(item => e.isAdmin.toString() == item)
      });
    }

  }

  truncate(str: string, n: number){
    return (str.length > n) ? str.substr(0, n-1) + '...' : str;
  };

  async makeAdmin(member: MemberManage) {
    let loadingOverlay = this.dialog.open(LoadingComponent);
    try {
      await this.memberService.makeEB(member);
      member.isAdmin = true;
      this.doFilter();
    } catch (e) {
      this.dialog.open(ErrorComponent, {data: e});
    } finally {
      loadingOverlay.close();
    }
  }


  async revokeAdmin(member: MemberManage) {
    let loadingOverlay = this.dialog.open(LoadingComponent);
    try {
      await this.memberService.revokeEB(member);
      member.isAdmin = false;
      this.doFilter();
    } catch (e) {
      this.dialog.open(ErrorComponent, {data: e});
    } finally {
      loadingOverlay.close();
    }
  }

}
