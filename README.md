# Resumable File Management System

## Project Overview

This project is a modern web application built with Vue 3 that provides a robust interface for
managing hierarchical data (Cases -> Collections -> Files) and features a highly resilient,
resumable file transfer system.

It is designed to handle large file uploads and downloads gracefully, recovering from network
interruptions and allowing users to pause, resume, or cancel transfers at any time.

**Key Features:**

- **Authentication & Authorization:** Simple login system with Role-Based Access Control (RBAC).
  Differentiates between 'admin' (can create, edit, delete, upload) and 'employee' users (view and
  download only).
- **Hierarchical Data Management:** Organize files within collections, and collections within cases.
- **Resumable Uploads:** Powered by the TUS protocol, allowing large files to be securely uploaded
  in chunks.
- **Resumable Downloads:** Utilizes HTTP `Range` headers and the modern browser File System Access
  API to stream downloads directly to disk, avoiding memory bloat and enabling pause/resume
  functionality.
- **Global Transfer Management:** A persistent UI panel that tracks the progress, speed, and status
  of all active transfers regardless of user navigation.
- **Offline Resilience:** Automatically detects network drops to pause transfers and attempts to
  resume them once connectivity is restored.

---

## Setup Instructions

This application requires running multiple services to function fully: the frontend dev server, a
mock JSON API for data persistence, a TUS server for uploads, and a custom backend for chunked
downloads.

### 1. Frontend & Mock API

1. Clone the repository and navigate to the project root.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the mock API server (handles cases, collections, and file metadata):
   ```bash
   npm run mock-api
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```

### 2. Upload Server (tusd)

The application uses `tusd`, the official reference implementation of the TUS resumable upload
protocol.

1. Download the pre-compiled `tusd` binary for your operating system from the
   [official releases page](https://github.com/tus/tusd/releases).
2. Extract the executable and run it locally. By default, it will start on port 1080.
   ```bash
   .\tusd.exe --upload-dir .\uploads --port 1080
   ```

### 3. Download Server

A secondary backend handles chunked file delivery using HTTP `Range` headers.

1. Navigate to the download backend directory:
   ```bash
   cd backend-download
   ```
2. Install dependencies (if any):
   ```bash
   npm install
   ```
3. Start the server (runs on port 4000 by default):
   ```bash
   node server.js
   ```

---

## UI/UX Flow

1. **Authentication:** The user logs in via the Login page. Their role (`admin` or `employee`)
   dictates their read/write permissions throughout the application.
2. **Dashboard (Cases View):** The user lands on the dashboard, viewing a list of their current
   cases. Admins can create, edit, or delete cases safely through modal forms and confirmation
   dialogs.
3. **Collections View:** Clicking on a case navigates to the Collections page. Here, the user sees
   folders (collections) specific to that case. Admins can manage these collections similarly.
4. **Files View:** Inside a collection, a data table lists all uploaded files. Admins can initiate
   new simulated or real uploads. All users can request to download existing files.
5. **Transfer Panel:** Upon starting an upload or download, a global Transfer Panel opens as a
   floating window.
   - Users can navigate away from the files page; the panel persists across route changes.
   - The panel displays real-time progress bars, calculated transfer speeds, and action buttons to
     Pause, Resume, or Cancel individual transfers.
   - Users can close the panel and reopen it via a global toggle button in the top bar.

---

## Component Architecture & State Management

State is centrally managed using Pinia stores to separate business logic from UI components.

_Component Hierarchy Description:_

![Component Architecture & State Management](./Component%20Architecture%20&%20State%20Management.png)

**State Flow:**

- **Stores:** `AuthStore`, `CaseStore`, `CollectionStore`, `FileStore` manage API CRUD operations
  via dedicated Service classes.
- **TransferStore:** Acts as a central nervous system for network operations. It receives triggers
  from the UI (e.g., `startUpload`), spawns underlying service calls (`UploadService`,
  `DownloadService`), and reactively updates state (`progress`, `speed`, `status`) which the
  `TransferPanel` UI reflects.

---

## Assumptions & Design Decisions

- **Layered Architecture:** This project follows a Layered Architecture. Given the current scope and
  size of the application, this structure provides a clean separation of concerns without the
  overhead of more complex patterns like Feature-based architecture, which is typically reserved for
  much larger systems.
- **Upload Protocol (TUS):** I chose the TUS protocol over a custom chunking solution for uploads.
  TUS is an open standard that guarantees reliable, resumable uploads even over poor networks. I
  used `tus-js-client` on the frontend.
- **Data Integrity on Upload Error:** When an upload fails critically (TUS protocol failure), the
  application is designed to immediately delete the corresponding file record from the database.
  While an alternative would be to maintain temporary metadata until a successful upload, deleting
  on error is a more robust approach that ensures strict data integrity and correctness. Although
  this may increase server load during retries compared to metadata-only tracking, the guarantee of
  a clean and accurate file registry is a priority.
- **Download Strategy (File System Access API & Range Headers):** Instead of downloading the file
  into browser RAM (Blob) and saving it at the end (which crashes for multi-gigabyte files), I use
  the File System Access API to stream the file directly to the user's local disk in small
  manageable chunks using HTTP `Range` requests.
  - _Trade-off:_ The File System Access API is modern and not universally supported across all
    legacy or mobile browsers yet.
- **Global Transfer State:** Transfers are tied to a global Pinia store rather than a local
  component state. This ensures a user can start a 10GB download and navigate freely around the app
  without destroying the transfer context.
- **Event Listeners for Connectivity:** Hooked into browser `online`/`offline` events within the
  `TransferStore` to preemptively halt streams before they time out, allowing for immediate
  automatic resumption once the network returns.

---

## Future Work

- **Transfer Persistence:** Currently, active transfers are lost if the page is hard-refreshed. A
  key future enhancement will be implementing persistence (using IndexedDB or LocalStorage) to track
  and resume transfers automatically after a page reload.

---

## Notes

- **Tusd-js-client Bug (parallelUploads):** I discovered a bug in `tus-js-client` where using the
  `parallelUploads` property causes an infinite retry loop if the server becomes unreachable. While
  parallel uploads can significantly speed up large transfers, I have opted to disable this feature
  to maintain transfer stability and data correctness.
- **Mock Backend Limitations (Cascaded Delete):** Since the backend is currently mocked using
  `json-server`, cascaded deletes are not implemented. Deleting a Case or a Collection will leave
  its children (Collections or Files) as orphaned data in the mock database.

---

## Tech Stack & Tools Used

- **Framework:** Vue.js 3 (Composition API & `<script setup>`)
- **State Management:** Pinia
- **Routing:** Vue Router
- **UI Components:** PrimeVue (DataTables, Dialogs, Buttons, Inputs)
- **Styling:** Tailwind CSS (utility-first styling layered over PrimeVue components)
- **Upload Protocol Strategy:** TUS Protocol (`tus-js-client`, `tusd` binary server)
- **Download Strategy:** HTTP Range Fetch + File System Access API (`showSaveFilePicker`)
- **Build Tool:** Vite
- **Mock Backend:** `json-server` + Custom NodeJS Express app for Downloads.

## AI Usage

- **Code Generation:** Used AI to generate different parts through out the project. AI was used in
  every commit message.
- **research:** AI has been used for research purposes to know about different technologies and
  tools used in the project, and used to learn deeply about TUS protocol and how it works.
