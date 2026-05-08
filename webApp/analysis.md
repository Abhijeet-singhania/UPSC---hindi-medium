# Drishti UPSC Platform - Codebase Analysis

## 1. Project Overview
The web application is known as **Drishti** (Drishti UPSC CSE Platform), designed to aid students with their UPSC Civil Services Examination preparation. The project explicitly supports bilingual users (Hindi and English), as evidenced by the `i18next` configuration and structure.

## 2. Technology Stack
- **Core Framework**: React 19 wrapped with Vite 8.
- **Styling**: Tailwind CSS v4, utilizing heavily bespoke inline utility classes for gradients, borders, and flex/grid architectures.
- **State & Data Fetching**: TanStack React Query v5 (`@tanstack/react-query`) for API data, and Redux Toolkit (`@reduxjs/toolkit`, `react-redux`) for global authentication state.
- **Routing**: React Router DOM v7 (`react-router-dom`).
- **Localization (i18n)**: `i18next` and `react-i18next`. The app defaults to Hindi (`hi`) with English (`en`) fallback.
- **Icons**: `lucide-react`.
- **Linting & Code Quality**: ESLint v9.

## 3. Top-Level Directory map (`/src`)
- **assets/**: Intended for static media.
- **components/layout/**: Contains the global application layout mechanism.
  - `AppLayout.jsx`: The shell of the application mapping a collapsible Sidebar, a Topbar, and leveraging `<Outlet />` for rendering pages.
  - `Sidebar.jsx`: The main navigation menu with links mapping to various modules like Dashboard, Roadmap, Study Content, Prelims Lab, and Community.
  - `Topbar.jsx`: The top header component.
  - `ProtectedRoute.jsx`: Component wrapping authenticated routes, redirecting unauthenticated users to login.
- **hooks/**: Houses custom React hooks, specifically `useApi.js`—which acts as a unified abstraction over `fetch` or `axios` API calls.
- **locales/**: Contains structured JSON dictionaries (`en/translation.json`, `hi/translation.json`) utilized by the i18n engine.
- **pages/**: Contains isolated features/modules mounted as routes:
  - `Dashboard`: The main landing view featuring greetings, progress metrics, today's plans, and current affairs digests.
  - `Roadmap`, `StudyContent`, `CurrentAffairs`, `PrelimsLab`, `PastYearProblems`, `Community`, `Wellbeing`: Further core application modules mapped to the router.
- **store/**: Global state configuration mapping Redux slices (`authSlice.js`).
- `App.jsx`: Global route definitions mapping specific paths to `pages` components.
- `main.jsx`: Application bootstrap file where contexts (i18n provider, Redux provider, Query client) are initialized.
- `i18n.js`: Initialization of the `i18next` localization library mapping to `/locales`.

## 4. Architectural Highlights
- **Progressive UI Implementation**: Realized via Neumorphic or Premium dark-mode influences. Elements such as the `Sidebar` utilize rich gradients (`bg-gradient-to-br`) and precision borders (`border-[#2f2d2a]`).
- **Responsive Navigation**: The sidebar supports standard and collapsed (`isCollapsed`) states shifting its structural grid footprint and adjusting internal item paddings for cleaner focus modes.
- **Module Separation**: The app follows a clear container-presenter structure separating the globally invariant `layout` components from highly specialized route-based `pages`.
- **Authentication Flow**: Managed via Redux Toolkit (`authSlice.js`) utilizing JWTs mapped to `localStorage` and a `ProtectedRoute` for component-level route security.

## 5. Current Steps Done (Context for Future Iterations)
- **Global Tailwind CSS Refactor**: All main screens have been refactored to Tailwind CSS v4, removing legacy CSS files and reducing reliance on global styles.
- **Redux Auth Integration**: A robust login flow has been implemented that interfaces with the backend `/api/v1/users/login`, stores the JWT access token, and leverages `ProtectedRoute` to restrict access to authenticated areas.
- **PYQ Integration**: The Past Year Questions frontend interface has been integrated to consume the new backend PYQ endpoints.

## 6. Potential Action Items
- Abstract reusable metric cards and checklist items from `Dashboard.jsx` into globally accessible subcomponents.
- Integrate `useApi` globally to start hydrating mocked components inside `Dashboard.jsx`.
- Expand test coverage for Redux slices and component logic.
