import tkinter as tk
from tkinter import filedialog, messagebox, ttk
import mysql.connector
import openpyxl
from datetime import datetime, date, time
import os
import re

class ExcelFormPopulator:
    def __init__(self, master):
        self.master = master
        self.master.title("Tour Motorbike Form Populator")
        self.master.geometry("600x400")
        self.master.configure(bg="#f0f0f0")
        
        # Database connection variables (should be moved to a config file in production)
        self.db_config = {
            "host": "127.0.0.1",
            "port": "3306",
            "user": "root",
            "password": "0821411984",
            "database": "booking_system"
        }
        
        # Initialize variables
        self.template_path = ""
        self.output_folder = ""
        self.conn = None
        self.cursor = None
        self.current_booking = None  # Store current booking data
        
        # Create UI elements
        self.create_widgets()
        
        # Cell mappings based on the provided information
        self.cell_mappings = {
            "booking_date": ["J3", "J30"],
            "booking_no": ["J4", "J31"],
            "customer_name": ["D11", "D38", "G25", "G52"],
            "room": ["D13", "D40"],
            "travel_date": ["F13", "F40"],
            "pickup_time": ["I13", "I40"],
            "payment_status": ["D22", "D49"],
            "staff_name": ["B25", "B52"]
        }
        
        # Formula mappings - cells where formulas need to be applied
        self.formula_cells = {
            "J16": "=H16*I16",  # Total = Price * Quantity for first section
            "J43": "=H43*I43"   # Total = Price * Quantity for second section
        }
        
        # Value mappings for direct values
        self.value_mappings = {
            "quantity": ["I16", "I43"],  # Number of people
            "price": ["H16", "H43"]     # Total price
        }
    
    def create_widgets(self):
        # Frame for template selection
        template_frame = tk.LabelFrame(self.master, text="Template Selection", padx=10, pady=10, bg="#f0f0f0")
        template_frame.pack(fill="x", padx=10, pady=10)
        
        tk.Label(template_frame, text="Excel Template:", bg="#f0f0f0").grid(row=0, column=0, sticky="w")
        self.template_entry = tk.Entry(template_frame, width=50)
        self.template_entry.grid(row=0, column=1, padx=5)
        tk.Button(template_frame, text="Browse", command=self.browse_template).grid(row=0, column=2, padx=5)
        
        tk.Label(template_frame, text="Output Folder:", bg="#f0f0f0").grid(row=1, column=0, sticky="w", pady=5)
        self.output_entry = tk.Entry(template_frame, width=50)
        self.output_entry.grid(row=1, column=1, padx=5, pady=5)
        tk.Button(template_frame, text="Browse", command=self.browse_output).grid(row=1, column=2, padx=5, pady=5)
        
        # Frame for booking data
        booking_frame = tk.LabelFrame(self.master, text="Booking Information", padx=10, pady=10, bg="#f0f0f0")
        booking_frame.pack(fill="x", padx=10, pady=10)
        
        tk.Label(booking_frame, text="Booking Number:", bg="#f0f0f0").grid(row=0, column=0, sticky="w")
        self.booking_entry = tk.Entry(booking_frame, width=30)
        self.booking_entry.grid(row=0, column=1, sticky="w", padx=5)
        tk.Button(booking_frame, text="Get Booking", command=self.fetch_and_save_booking).grid(row=0, column=2, padx=5)
        
        # Frame for booking details display
        details_frame = tk.LabelFrame(self.master, text="Booking Details", padx=10, pady=10, bg="#f0f0f0")
        details_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Create a Treeview to display booking details
        self.tree = ttk.Treeview(details_frame, columns=("Field", "Value"), show="headings")
        self.tree.heading("Field", text="Field")
        self.tree.heading("Value", text="Value")
        self.tree.column("Field", width=150)
        self.tree.column("Value", width=400)
        self.tree.pack(fill="both", expand=True)
        
        # Bottom buttons
        button_frame = tk.Frame(self.master, bg="#f0f0f0")
        button_frame.pack(fill="x", padx=10, pady=10)
        
        tk.Button(button_frame, text="Generate Excel", command=self.generate_excel).pack(side="right", padx=5)
        tk.Button(button_frame, text="Clear", command=self.clear_form).pack(side="right", padx=5)
        
        # Status bar
        self.status_var = tk.StringVar()
        self.status_var.set("Ready")
        status_bar = tk.Label(self.master, textvariable=self.status_var, bd=1, relief=tk.SUNKEN, anchor=tk.W)
        status_bar.pack(side=tk.BOTTOM, fill=tk.X)
        
    def browse_template(self):
        filepath = filedialog.askopenfilename(
            title="Select Excel Template",
            filetypes=[("Excel files", "*.xlsx"), ("All files", "*.*")]
        )
        if filepath:
            self.template_path = filepath
            self.template_entry.delete(0, tk.END)
            self.template_entry.insert(0, filepath)
            self.status_var.set(f"Template selected: {os.path.basename(filepath)}")
    
    def browse_output(self):
        folder = filedialog.askdirectory(title="Select Output Folder")
        if folder:
            self.output_folder = folder
            self.output_entry.delete(0, tk.END)
            self.output_entry.insert(0, folder)
            self.status_var.set(f"Output folder selected: {folder}")
    
    def connect_to_database(self):
        try:
            self.conn = mysql.connector.connect(**self.db_config)
            self.cursor = self.conn.cursor(dictionary=True)
            return True
        except mysql.connector.Error as err:
            messagebox.showerror("Database Connection Error", f"Error: {err}")
            return False
    
    def fetch_and_save_booking(self):
        """Fetch booking data and automatically save the Excel file"""
        if self.fetch_booking():
            # If template and output folder are set, automatically generate Excel
            if self.template_path and self.output_folder:
                self.generate_excel()
            else:
                # Prompt user to select template and output folder if not set
                if not self.template_path:
                    messagebox.showinfo("Template Required", "Please select an Excel template.")
                    self.browse_template()
                    
                if not self.output_folder and self.template_path:
                    messagebox.showinfo("Output Folder Required", "Please select an output folder.")
                    self.browse_output()
                    
                # Try again to generate if both are now selected
                if self.template_path and self.output_folder:
                    self.generate_excel()
    
    def fetch_booking(self):
        """Fetch booking data and return True if successful, False otherwise"""
        booking_no = self.booking_entry.get().strip()
        if not booking_no:
            messagebox.showwarning("Input Required", "Please enter a booking number.")
            return False
        
        # Clear existing tree items
        for item in self.tree.get_children():
            self.tree.delete(item)
        
        # Connect to database
        if not self.connect_to_database():
            return False
        
        try:
            # Fetch booking data
            query = """
            SELECT 
                booking_no, 
                booking_date, 
                travel_date, 
                pickup_time, 
                customer_name,
                customer_surname,
                CONCAT(customer_name, ' ', customer_surname) AS full_name,
                room, 
                payment_status, 
                staff_name, 
                received,
                quantity
            FROM 
                tour_motobike_rental 
            WHERE 
                booking_no = %s
            """
            self.cursor.execute(query, (booking_no,))
            booking = self.cursor.fetchone()
            
            if booking:
                # Store the current booking data
                self.current_booking = booking
                
                # Display booking data in the tree
                for field, value in booking.items():
                    # Format dates and times for display
                    displayed_value = value
                    if isinstance(value, date) or isinstance(value, datetime):
                        displayed_value = value.strftime("%d/%m/%Y")
                    elif isinstance(value, time):
                        displayed_value = value.strftime("%H:%M")
                    
                    self.tree.insert("", "end", values=(field, displayed_value))
                
                self.status_var.set(f"Booking {booking_no} found.")
                return True
            else:
                messagebox.showinfo("No Data", f"No booking found with number: {booking_no}")
                self.status_var.set(f"No booking found for {booking_no}")
                return False
        
        except mysql.connector.Error as err:
            messagebox.showerror("Database Error", f"Error fetching booking: {err}")
            return False
        finally:
            self.close_connection()
    
    def generate_excel(self):
        if not self.current_booking:
            booking_no = self.booking_entry.get().strip()
            if not booking_no:
                messagebox.showwarning("Input Required", "Please enter a booking number.")
                return False
                
            # Try to fetch the booking first if not already fetched
            if not self.fetch_booking():
                return False
        
        if not self.template_path:
            messagebox.showwarning("Template Required", "Please select an Excel template.")
            return False
            
        if not self.output_folder:
            messagebox.showwarning("Output Folder Required", "Please select an output folder.")
            return False
        
        try:
            # Load the Excel template
            try:
                workbook = openpyxl.load_workbook(self.template_path)
                sheet = workbook.active
                
                booking = self.current_booking
                
                # Map database fields to Excel cells
                for field, cells in self.cell_mappings.items():
                    value = None
                    
                    # Handle special case for full name
                    if field == "customer_name":
                        value = booking["full_name"]
                    elif field in booking and booking[field] is not None:
                        value = booking[field]
                    
                    # Format dates and times
                    if field == "booking_date" or field == "travel_date":
                        if value:
                            if isinstance(value, (date, datetime)):
                                value = value.strftime("%d/%m/%Y")
                    elif field == "pickup_time" and value:
                        if isinstance(value, (time, datetime)):
                            value = value.strftime("%H:%M")
                    
                    # Populate all cells mapped to this field
                    if value is not None:
                        for cell in cells:
                            sheet[cell] = value
                
                # Apply quantity if available
                if "quantity" in booking and booking["quantity"] is not None:
                    for cell in self.value_mappings["quantity"]:
                        sheet[cell] = booking["quantity"]
                
                # Add a received value to price cells if available
                if "received" in booking and booking["received"] is not None:
                    for cell in self.value_mappings["price"]:
                        sheet[cell] = booking["received"]
                
                # Set formulas for total calculation cells
                for cell, formula in self.formula_cells.items():
                    sheet[cell].value = formula
                
                # Generate filename with booking number and date
                today = datetime.now().strftime("%Y%m%d")
                booking_no = booking["booking_no"]
                output_filename = f"Booking_{booking_no}_{today}.xlsx"
                output_path = os.path.join(self.output_folder, output_filename)
                
                # Save the populated template
                workbook.save(output_path)
                messagebox.showinfo("Success", f"Excel form has been generated:\n{output_path}")
                self.status_var.set(f"Excel form generated: {output_filename}")
                
                # Ask if user wants to open the file
                if messagebox.askyesno("Open File", "Do you want to open the generated file?"):
                    os.startfile(output_path)
                
                return True
            
            except Exception as e:
                messagebox.showerror("Excel Error", f"Error generating Excel file: {e}")
                return False
                
        except Exception as err:
            messagebox.showerror("Error", f"Error generating Excel: {err}")
            return False
    
    def clear_form(self):
        self.booking_entry.delete(0, tk.END)
        for item in self.tree.get_children():
            self.tree.delete(item)
        self.current_booking = None
        self.status_var.set("Ready")
    
    def close_connection(self):
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()

def main():
    root = tk.Tk()
    app = ExcelFormPopulator(root)
    root.mainloop()

if __name__ == "__main__":
    main()