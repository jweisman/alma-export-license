import { Component, OnInit } from '@angular/core';
import { DialogService, PromptDialogData } from 'eca-components';
import { finalize } from 'rxjs/operators';
import { CollectionPickerDialog } from '../collection-picker/collection-picker.component';
import { Collection } from '../models/collection';
import { AlmaService } from '../services/alma.service';
import { DataService } from '../services/data.service';
import * as XLSX from 'xlsx';
import { SettingsService } from '../services/settings.service';
import { Settings } from '../models/settings';
import { parseLicense } from '../models/alma';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent implements OnInit {

  loading = false;
  settings: Settings;

  constructor(
    public data: DataService,
    private alma: AlmaService,
    private dialog: DialogService,
    private settingsService: SettingsService,
  ) { }

  ngOnInit() {
    this.settingsService.get()
    .subscribe(settings => {
      this.settings = settings;
      this.populateCollectionPath(settings)
    });
  }

  selectCollection() {
    const dialogData: PromptDialogData = { 
      title: 'COLLECTION_PICKER.TITLE', 
      val: this.data.rootCollection,
    }
    this.dialog.prompt(CollectionPickerDialog, dialogData)
    .subscribe((result: Collection) => {
      if (!result) return;
      this.data.rootCollection = result;
    });
  }

  download() {
    this.loading = true;
    this.alma.getLicense(this.data.licenseCode)
    .pipe(finalize(() => this.loading = false))
    .subscribe(license => {
      const wb = this.data.buildExcel(license, this.settings.includeInventory);
      XLSX.writeFile(wb, `${license.code}.xlsx`);
    })
  }

  populateCollectionPath(settings: Settings) {
    if (!this.data.licenseCode || settings.collectionPath.length == 0) return; 
    this.loading = true;
    this.alma.getLicense(this.data.licenseCode)
    .pipe(finalize(() => this.loading = false))
    .subscribe(license => {
      this.data.collectionPath = settings.collectionPath.map(p => parseLicense(p, license)).join('/');
    })
  }
}

