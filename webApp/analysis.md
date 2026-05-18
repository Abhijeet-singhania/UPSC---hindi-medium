# Drishti UPSC Platform - Codebase Analysis

## 1. Project Overview
The web application is known as **Drishti** (Drishti UPSC CSE Platform), designed to aid students with their UPSC Civil Services Examination preparation. The project explicitly supports bilingual users (Hindi and English), as evidenced by the `i18next` configuration and structure.

## 2. Technology Stack
- **Core Framework**: React 19 wrapped with Vite 8.
- **Styling**: Tailwind CSS v4, utilizing heavily bespoke inline utility classes for gradients, borders, and flex/grid architectures.
- **State & Data Fetching**: TanStack React Query v5 (`@tanstack/react-query`) for API data, Redux Toolkit (`@reduxjs/toolkit`, `react-redux`) for global authentication state, and native React Context (`ThemeContext.jsx`) for global theme state.
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
- **context/**: Houses React Context providers, specifically `ThemeContext.jsx` for managing and persisting Light/Dark mode state via `localStorage`.
- **locales/**: Contains structured JSON dictionaries (`en/translation.json`, `hi/translation.json`) utilized by the i18n engine.
- **pages/**: Contains isolated features/modules mounted as routes:
  - `Dashboard`: The main landing view featuring greetings, progress metrics, today's plans, and current affairs digests.
  - `Roadmap`, `StudyContent`, `CurrentAffairs`, `PrelimsLab`, `PastYearProblems`, `Community`, `Wellbeing`: Further core application modules mapped to the router.
- **store/**: Global state configuration mapping Redux slices (`authSlice.js`).
- `App.jsx`: Global route definitions mapping specific paths to `pages` components.
- `main.jsx`: Application bootstrap file where contexts (i18n provider, Redux provider, Query client) are initialized.
- `i18n.js`: Initialization of the `i18next` localization library mapping to `/locales`.

## 4. Architectural Highlights
- **Progressive UI Implementation**: Realized via Neumorphic or Premium influences. The application utilizes a Global Semantic Theme Architecture defined in `index.css` via Tailwind v4's `@theme` directive (e.g., `--bg-base`, `--text-primary`), eliminating hardcoded hex codes for robust dynamic theming.
- **Responsive Navigation**: The sidebar supports standard and collapsed (`isCollapsed`) states shifting its structural grid footprint and adjusting internal item paddings for cleaner focus modes.
- **Module Separation**: The app follows a clear container-presenter structure separating the globally invariant `layout` components from highly specialized route-based `pages`.
- **Authentication Flow**: Managed via Redux Toolkit (`authSlice.js`) utilizing JWTs mapped to `localStorage` and a `ProtectedRoute` for component-level route security.
- **Global Theme State**: Managed via `ThemeContext.jsx`, allowing instant switching between `.light` and `.dark` palettes mapped in `index.css`. The preference is stored in `localStorage` ('app-theme').

## 5. Current Steps Done (Context for Future Iterations)
- **Global Tailwind CSS Refactor**: All main screens have been refactored to Tailwind CSS v4, removing legacy CSS files and reducing reliance on global styles.
- **Global Theme Architecture**: Swept the entire repository to purge hardcoded inline hex colors, replacing them with semantic Tailwind utility classes (e.g., `bg-bg-panel`, `text-text-primary`). Designed a full Light Mode and Dark Mode palette in `index.css` alongside a functional UI Theme Switcher.
- **Redux Auth Integration**: A robust login flow has been implemented that interfaces with the backend `/api/v1/users/login`, stores the JWT access token, and leverages `ProtectedRoute` to restrict access to authenticated areas.
- **PYQ Integration**: The Past Year Questions frontend interface has been integrated to consume the new backend PYQ endpoints.
- **Community & Well-being Updates**: Added optimistic like/unlike mechanics for the community module. Fully integrated the Silent Library with join/leave sessions, live elapsed timers, active-users list, XP-per-minute tracking, and session history via API. Upgraded the Pomodoro timer with a groovy SVG animation, native full-screen mode, and a built-in customizable Music Player (supports dynamic custom URLs) that appears during full-screen focus sessions.
- **Rewards System Frontend**: Implemented live reputation and study-time leaderboards powered by the API. Introduced dynamic badges showing real progress and a rank ladder based on user reputation.
- **Bug Fixes**: Resolved 405 Method Not Allowed errors on voting endpoints by strictly enforcing `POST` requests in the API hook. Scrubbed hardcoded light-mode hex colors from the Current Affairs module, replacing them with semantic Tailwind classes for seamless Dark Mode compatibility.

## 6. Potential Action Items
- Abstract reusable metric cards and checklist items from `Dashboard.jsx` into globally accessible subcomponents.
- Integrate `useApi` globally to start hydrating mocked components inside `Dashboard.jsx`.
- Expand test coverage for Redux slices and component logic.

## 7. Developer & User Guides

### How to Extract Direct .mp3 CDN URLs (e.g., from Pixabay)
To add a custom track to the Music Player, you need a direct `.mp3` URL. If you want to use a track from Pixabay, follow these steps using your browser's Developer Tools:

**1. Open Developer Tools (Network Tab)**
- Go to the Pixabay page (e.g., `https://pixabay.com/music/lofi-chill-519877/`).
- Right-click anywhere on the page and select **"Inspect"** (or press `Ctrl + Shift + I` / `F12` on Windows).
- In the Developer Tools panel that opens up, click on the **"Network"** tab.
- Right below the Network tab, you will see a filter menu. Click on **"Media"**.

**2. Capture the Audio URL**
- Go back to the web page (with the Network tab still open) and click the **Play** button to start playing the song.
- The moment the song starts buffering, a new entry will pop up in your Network tab. It will usually have `.mp3` in the name.
- Right-click that new file entry in the Network tab.
- Select **Copy -> Copy URL** (or "Copy link address").

That copied link is the raw `https://cdn.pixabay.com/audio/...mp3` link! You can now paste that exact URL into the Custom Track input in the application, hit the `+` button, and it will play perfectly.
