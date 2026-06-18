# Inventory Management System

A production-ready, client-side Inventory Management System built from scratch with Vanilla JavaScript. This project showcases structured design, responsive layout, and robust data persistence using browser local storage.

## Features

- **Dashboard Metrics**: Real-time cards displaying Total Products, Total Stock, Low Stock Items, Out of Stock Items, and Total Inventory Value.
- **Product Management (CRUD)**:
  - Create: Add new products with auto-generated unique IDs.
  - Read: Display products in a responsive, styled data table.
  - Update: Inline editing of product properties.
  - Delete: Safe deletion of records with custom confirmation dialogs.
- **Search & Filters**: Quick-filtering by stock level status, search by name or category, and sorting by name, price, and stock levels.
- **Stock Control**: Increment and decrement utilities with guard rails to prevent negative stock counts.
- **Validation**: Strict client-side validation to ensure clean input data (e.g., positive price, positive quantity, mandatory fields).
- **Responsive Layout**: Designed mobile-first, using standard modern CSS (Flexbox & Grid).

## Tech Stack

- **Markup**: HTML5 (Semantic elements)
- **Styling**: CSS3 (Custom properties, grid layouts, animations, transitions)
- **Scripting**: Modern Javascript (ES6+, modular architecture, Async Local Storage wrappers)
- **Storage**: Browser localStorage API

## Getting Started

1. Clone this repository:
   ```bash
   git clone <repository-url>
   ```
2. Open `index.html` directly in your browser, or serve it using a local server extension (e.g., VS Code Live Server).
