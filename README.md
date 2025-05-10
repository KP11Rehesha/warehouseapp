# Warehouse Management System

A comprehensive web application for managing warehouse inventory, products, storage, shipments, and expenses. Built with a modern tech stack including Node.js, Express, Prisma, PostgreSQL on the backend, and React, Next.js, Redux Toolkit, Tailwind CSS on the frontend.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Available Scripts](#available-scripts)
- [Key Functionalities](#key-functionalities)
- [Future Enhancements](#future-enhancements)

## Features

**User Management:**
*   Email/Password Authentication (Sign-up & Login)
*   Role-Based Access Control (Admin, Warehouse Staff)
*   JWT for secure sessions

**Product & SKU Management:**
*   Full CRUD operations for Products (Name, SKU, Description, Price)
*   Product attributes: Dimensions, Weight, Image URL, Rating
*   Category tagging for product grouping (CRUD for Categories)
*   Minimum stock level definition per product for low-stock alerts

**Storage Location Management:**
*   Define and manage Storage Bins/Zones (Name/ID, Description, Dimensions, Capacity)
*   Map products to specific bin locations
*   Track quantity of each product in each bin

**Inventory Tracking:**
*   Real-time stock levels per SKU (total) and per location (bin)
*   **Check-in Workflow (Goods Receipts):**
    *   Record inbound shipments/receipts (Supplier, Notes, Items)
    *   Automatically increase stock in specified bins and update total product stock.
    *   Log of all goods receipts.
*   **Check-out Workflow (Shipments):**
    *   Record outbound shipments (Customer, Notes, Items)
    *   Pick items from specific bins.
    *   Automatically decrease stock from specified bins and update total product stock.
    *   Log of all shipments.

**Expense Tracking:**
*   CRUD operations for expenses
*   Categorize expenses
*   Track expense amount and date

**Dashboard & Reporting:**
*   **KPIs:**
    *   Total Active Products
    *   Number of Items Low on Stock
    *   Total Stock Value
    *   Goods Receipts (Last 7 Days)
    *   Shipments (Last 7 Days)
    *   Total Expenses (Current Month)
*   **Charts:**
    *   Stock Movement (Items Received vs. Shipped - Last 30 Days)
    *   Expenses by Category (Current Month Pie Chart)

## Tech Stack

**Backend:**
*   Node.js
*   Express.js
*   Prisma ORM
*   PostgreSQL
*   TypeScript
*   JWT (JSON Web Tokens) for authentication
*   Bcrypt.js for password hashing

**Frontend:**
*   React
*   Next.js (App Router)
*   Redux Toolkit (including RTK Query for API interactions)
*   TypeScript
*   Tailwind CSS for styling
*   Recharts for data visualization
*   Lucide React for icons

## Project Structure
