# Mathilde Gest - Tapisserie d'Ameublement

Project portfolio and business website for Mathilde Gest, Tapissier Décorateur.

## Features

-   **Showcase**: Portfolio of realization and workshop details.
-   **Client Space**: Authenticated area for customers to view appointments and messages.
-   **Admin Dashboard**: Manage messages, appointments, and reviews (Role-based access).
-   **Messaging System**: Two-way communication between clients and admin.
-   **Appointment Booking**: Request and status management (Pending, Confirmed, Cancelled).

## Tech Stack

-   **Frontend**: HTML, CSS, JavaScript (Vanilla module based).
-   **Backend**: Supabase (PostgreSQL, Auth, Realtime).

## Setup

1.  Clone the repository.
2.  Update `js/config.js` with your Supabase Project URL and **ANON Public Key**.
3.  Open `index.html` in a browser (or serve with a live server).

## Security Note

Ensure you only use the **Public Anon Key** in the frontend code (`js/config.js`). Never expose the Service Role key.
