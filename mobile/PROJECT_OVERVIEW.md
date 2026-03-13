# UPSC Hindi Network - Project Overview

## 1. Introduction
The **UPSC Hindi Network** is a React Native mobile application tailored for Hindi-medium UPSC aspirants. It aims to provide a platform for studying, question-and-answer interactions, daily practice, and tracking progress through a gamified interface.

## 2. Core Concepts
* **Gamified UI/UX:** The app draws inspiration from popular gamified apps like Duolingo, using an authentic light theme, vibrant navigation components, and clear icon-led interfaces.
* **Component-Based Architecture:** Uses a modular component structure leveraging React Native Functional Components and Hooks.
* **API-Driven Data Flow:** Connects to a robust backend infrastructure handling Users, Q&A topics, Daily questions, and "Silent Library" study sessions.
* **Internationalization (i18n):** The app is heavily localized into Hindi utilizing `i18next` and `react-i18next`.
* **State & Data Management:** Uses `@tanstack/react-query` to manage remote data state, caching, and background synchronizations, supplemented with `@react-native-async-storage/async-storage` for persistence.
* **Animations:** Employs `react-native-reanimated` for smooth, native-driven animations (e.g., custom animated tab bars).

## 3. Technology Stack
* **Framework:** React Native 0.83.1 / React 19.2.0
* **Language:** TypeScript
* **Navigation:** React Navigation 7 (Stack & Bottom Tabs)
* **Data Fetching:** React Query v5
* **Localization:** i18next
* **Animations:** Reanimated v4
* **Storage:** Async Storage

## 4. Project Structure
The project’s source code is encapsulated within the `src/` directory:

```text
src/
├── components/   # Reusable UI components (e.g., AnimatedTabBar)
├── context/      # React Context definitions (e.g., UserContext)
├── hooks/        # Custom React Hooks for queries and mutations (e.g., useDailyMutations)
├── i18n/         # Internationalization dictionary and config configuration (hi.json)
├── navigation/   # Navigation routing configuration (AppNavigator with Stack and BottomTabs)
├── providers/    # App-wide context providers (e.g., QueryProvider)
├── screens/      # Full-page screen components:
│   ├── HomeScreen.tsx
│   ├── QAScreen.tsx
│   ├── LeaderboardScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── DailyAnswerScreen.tsx
│   ├── SilentLibraryScreen.tsx
│   └── SplashScreen.tsx
├── services/     # API logic, network configs, query keys (api.ts, queryKeys.ts)
├── theme/        # Global styling, color palettes, spacing metrics (theme.ts)
└── types/        # TypeScript type interfaces across the app
```

## 5. Key Features & Screens
1. **Home (`HomeScreen`):** Central dashboard for the user.
2. **Q&A Feed (`QAScreen`):** Users can interact with community questions and answers.
3. **Leaderboard (`LeaderboardScreen`):** Gamified ranking to motivate studying based on reputation and study time.
4. **Profile (`ProfileScreen`):** User statistics, settings, and personal details management.
5. **Silent Library (`SilentLibraryScreen`):** A virtual study room where users join, see active peers, and track their study sessions.
6. **Daily Answer (`DailyAnswerScreen`):** Specific feature to write, submit, and browse daily answer-writing practice.

## 6. Development Workflow
* Metro Bundler is used to compile JavaScript files (`npm start`).
* Uses standard React Native CLI tools to build Android (`npm run android`) and iOS apps (`npm run ios`).
* Relies on ESLint and Prettier to enforce strict code styles, and TypeScript for static type checking.
