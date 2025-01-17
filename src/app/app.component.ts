import { Component, inject, OnInit } from '@angular/core';

import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmployeeModel } from './model/Employee';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title(title: any) {
    throw new Error('Method not implemented.');
  } 
  selectAllState: { [key: number]: boolean } = {};
  employeeForm: FormGroup = new FormGroup({});
  searchText: string | undefined;
  employeeObj: EmployeeModel = new EmployeeModel();
  employeeList: EmployeeModel[] = [];
  updateactive: boolean = false;
  http=inject(HttpClient);
  selectedEmployees: string[] = [];
  isAllSelected: boolean = false;
  filteredEmployees: EmployeeModel[]=[];

 // All employees after filtering
  pagedEmployees: EmployeeModel[] = [];     // Employees for the current page
  currentPage: number = 1;                  // Current page
  itemsPerPage: number = 10;  
  totalPages: number = 1; // Total number of pages
inputPageNumber: number = 1; // For direct navigation input

  
  // Items per page
  constructor(){
    this.createForm();
    const oldData = localStorage.getItem("EmpData");
    if(oldData != null) { 
      const parseData =  JSON.parse(oldData);
      this.employeeList =  parseData;
    }
    this.filteredEmployees = this.employeeList;
    this.onPageChange(this.currentPage); 
  }
  ngOnInit() {
    this.getData();
    this.calculateTotalPages();
  }
  // to calculate the no of pages 
  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.filteredEmployees.length / this.itemsPerPage);
  }
  // get the data from the api
  getData(): void {
    this.http.get('https://excelerate-profile-dev.s3.ap-south-1.amazonaws.com/1681980949109_users.json').subscribe((data: any) => {
      const oldData = localStorage.getItem("EmpData");
      if(oldData != null) { 
        const parseData =  JSON.parse(oldData);
        this.employeeList =  parseData;
      }
      else{
        this.employeeList = data;
      }
      this.filteredEmployees = this.employeeList;
      this.onPageChange(this.currentPage); 
    });
  }
  // Pagination navigation methods

  // function to go to first page directly
  goToFirstPage(): void {
    this.currentPage = 1;
    this.onPageChange(this.currentPage);
  }
  // function to go to last page directly
  goToLastPage(): void {
    this.currentPage = this.totalPages;
    this.onPageChange(this.currentPage);
  }
   // Pagination change handler
  
   goToNextPage(): void {
    if (this.currentPage * this.itemsPerPage < this.filteredEmployees.length) {
      this.currentPage++;
      this.onPageChange(this.currentPage);
    }
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.onPageChange(this.currentPage);
    }
  }
  // function trigred when page is changed
  onPageChange(page: number): void {
    this.currentPage = page;
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.pagedEmployees = this.filteredEmployees.slice(startIndex, endIndex);
  
    // Update the select-all state for the current page
    this.updateSelectAllState();
    this.calculateTotalPages(); // Recalculate total pages after any change
  }
  // function to go to to a page 
  goToPage(pageNumber: number): void {
    if (pageNumber >= 1 && pageNumber <= this.totalPages) {
      this.currentPage = pageNumber;
      this.onPageChange(this.currentPage);
    }
  }
  // function to update the paged employees
  updatePagedEmployees(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.pagedEmployees = this.filteredEmployees.slice(startIndex, endIndex);
  } 

  // functions for all crud operations


  // CREATE A NEW FORM 
  createForm() {
    this.employeeForm = new FormGroup({
      id: new FormControl(this.employeeObj.id),
      name: new FormControl(this.employeeObj.name,[Validators.required]),
      email: new FormControl(this.employeeObj.email),
      role: new FormControl(this.employeeObj.role) 
    })
  }

  // reset the form and empty the fields
  reset() {
    this.employeeObj = new EmployeeModel();
    this.createForm();
    this.updateactive = false;
  }

  // POPULATING THE THE FIELDS WHEN UPDATE METHOD IS CALLED
  onEdit(item: EmployeeModel) {
    this.updateactive = true;
    this.employeeObj =  item;
    this.createForm() 
  }

  // SAVING THE UPDATED FIELDS TO THE LOCAL STORAGE
  onUpdate() {
    const record =  this.employeeList.find(m=>m.id == this.employeeForm.controls['id'].value);
    if(record != undefined) {
      record.email = this.employeeForm.controls['email'].value;
      record.name = this.employeeForm.controls['name'].value;
      record.role = this.employeeForm.controls['role'].value;
    }
    localStorage.setItem("EmpData", JSON.stringify(this.employeeList)) ;
    this.updateactive = false;
    this.reset()
  }

  // DELETE A RECORD
  onDelete(id: string) {
    const isDelete = confirm("Are you sure want to Delete?");
    if (isDelete) {
      const index = this.employeeList.findIndex(m => m.id == id);
      if (index !== -1) {
        this.employeeList.splice(index, 1);
        localStorage.setItem("EmpData", JSON.stringify(this.employeeList));
        this.filteredEmployees = this.employeeList;
  
        // Check if the current page is still valid
        const maxPages = Math.ceil(this.filteredEmployees.length / this.itemsPerPage);
        if (this.currentPage > maxPages) {
          this.currentPage = maxPages || 1; // Fallback to page 1 if no pages are left
        }
        this.onPageChange(this.currentPage); // Update the paginated data
      }
    }
  }
  
  // FILTERING THE DATA BASED ON THE NAME EMAIL AND ROLE
  filterResults(text: string) {
    if (!text) {
      this.filteredEmployees = this.employeeList;
      return;
    }

    this.filteredEmployees = this.employeeList.filter(
      item => item?.name.toLowerCase().includes(text.toLowerCase()) || item?.email.toLowerCase().includes(text.toLowerCase()) || item?.role.toLowerCase().includes(text.toLowerCase())
    );
    this.onPageChange(1); 
  }

  // FUNCTION TO TOGGLE CHECK BOX
  toggleSelection(id: string): void {
    const index = this.selectedEmployees.indexOf(id);
    if (index === -1) {
      this.selectedEmployees.push(id);
    } else {
      this.selectedEmployees.splice(index, 1);
    }
    this.updateSelectAllState();
  }

  // FUNCTION TO SELECT ALL CHECK BOXES
    toggleAllSelection(event: Event): void {
      const isChecked = (event.target as HTMLInputElement).checked;
    
      if (isChecked) {
        this.selectedEmployees = [
          ...this.selectedEmployees,
          ...this.pagedEmployees
            .filter(emp => !this.selectedEmployees.includes(emp.id))
            .map(emp => emp.id)
        ];
      } else {
        // Deselect employees only on the current page
        this.selectedEmployees = this.selectedEmployees.filter(
          id => !this.pagedEmployees.some(emp => emp.id === id)
        );
      }
    
      // Update the "Select All" state for the current page
      this.selectAllState[this.currentPage] = isChecked;
    }

// Check if an employee is selected
isSelected(id: string): boolean {
  return this.selectedEmployees.includes(id);
}

// Check if all employees are selected on the current page
updateSelectAllState(): void {
  const allSelected = this.pagedEmployees.every(emp =>
    this.selectedEmployees.includes(emp.id)
  );

  // Set the Select All state for the current page
  this.selectAllState[this.currentPage] = allSelected;
}

// Delete selected employees
onDeleteSelected(): void {
  const isDelete = confirm("Are you sure want to Delete?");
  if (isDelete) {
    this.employeeList = this.employeeList.filter(emp => !this.selectedEmployees.includes(emp.id));
    localStorage.setItem("EmpData", JSON.stringify(this.employeeList));
    this.filteredEmployees = this.employeeList;

    // Check if the current page is still valid
    const maxPages = Math.ceil(this.filteredEmployees.length / this.itemsPerPage);
    if (this.currentPage > maxPages) {
      this.currentPage = maxPages || 1; // Fallback to page 1 if no pages are left
    }
    this.updatePagedEmployees();
    this.selectedEmployees = []; // Clear the selection
  }
  this.onPageChange(1); 
}

}
