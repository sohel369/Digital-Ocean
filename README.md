# AdPlatform Premium Dashboard (React)

This is a modern, responsive advertising dashboard built with React, Vite, and Tailwind CSS.

## Getting Started

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:5173](http://localhost:5173) in your browser.

3.  **Build for Production**
    ```bash
    npm run build
    ```

## Features

-   **Dashboard**: Real-time overview of campaign performance using Recharts.
-   **Campaign Creation**: Multi-step form with live ad preview (Desktop, Mobile, Email).
-   **Geo-Targeting**: Interactive Google Maps integration with radius targeting.
-   **Billing**: Pricing calculator and invoice history.
-   **Analytics**: Detailed breakdown of metrics by device and cost.
-   **Global State**: Managed via Context API (`AppContext`).

## Technology Stack

-   React 18
-   Vite
-   Tailwind CSS (Glassmorphism design)
-   Recharts (Data Visualization)
-   Lucide React (Icons)
-   Google Maps JavaScript API

## Notes

-   The Google Maps API key in `index.html` is a demo key. You may need to replace it with your own if it exceeds quota.
-   This project replaces the static HTML files found in the root directory.
