# Implementation Plan - New Features for Code Review AI

This document details the design and implementation steps for introducing four new features: Streaming AI Response, Auto-save code editor, Live dashboard updates, and a fully working Light/Dark theme toggle.

## Proposed Changes

---

### Feature 1: Streaming AI Response

#### [NEW] [route.ts](file:///c:/Users/Chakshita/OneDrive/Documents/CodeReview%20AI/app/api/review/stream/route.ts)
- Create a new API route utilizing the ReadableStream API.
- Use `GoogleGenerativeAI` with the `gemini-3-flash-preview` model and `generateContentStream` to stream the feedback.
- Clean the stream's accumulated output (remove code fences) and parse the final object as JSON to save in the database (`Review.create` and update user review count).
- Enqueue progress chunks and complete event containing the parsed report and database review ID to the client via SSE.

#### [MODIFY] [useReviews.ts](file:///c:/Users/Chakshita/OneDrive/Documents/CodeReview%20AI/hooks/useReviews.ts)
- Add `streamingStatus` state to the hook.
- Implement the streaming fetch in `submitReview`, decoding the stream chunk by chunk and updating the `streamingStatus` accordingly.
- Dispatch the `'reviewComplete'` CustomEvent on completion.
- Return `streamingStatus` from the hook.

#### [MODIFY] [ReviewLoader.tsx](file:///c:/Users/Chakshita/OneDrive/Documents/CodeReview%20AI/components/review/ReviewLoader.tsx)
- Accept `streamingStatus?: string | null` in `ReviewLoaderProps`.
- Render `streamingStatus` if provided, otherwise rotate messages as before.

---

### Feature 2: Auto-save Code Editor

#### [MODIFY] [page.tsx (new-review)](file:///c:/Users/Chakshita/OneDrive/Documents/CodeReview%20AI/app/(dashboard)/new-review/page.tsx)
- Save and restore current session in the code editor to/from `localStorage` (key: `code-review-ai:autosave`).
- Implement 2s debounce on changes to `code` and `language` variables.
- Show last-saved relative time below the code editor using the `formatRelativeTime` utility.
- Clear the saved session upon successful review completion.

---

### Feature 3: Live Dashboard Updates

#### [MODIFY] [page.tsx (dashboard)](file:///c:/Users/Chakshita/OneDrive/Documents/CodeReview%20AI/app/(dashboard)/dashboard/page.tsx)
- Refactor dashboard loading code into `fetchDashboardData` to reuse it for polling and events.
- Implement `useInterval` custom hook for polling every 30 seconds.
- Register an event listener for `'reviewComplete'` on `window` to refresh data instantly when a review completes.
- Display a dynamic visual pulse indicator and the relative last updated time in the dashboard header.

---

### Feature 4: Light/Dark Theme Toggle (FULLY WORKING)

#### [NEW] [theme.ts](file:///c:/Users/Chakshita/OneDrive/Documents/CodeReview%20AI/lib/theme.ts)
- Setup theme persistence helpers for `localStorage` and HTML classes.

#### [NEW] [ThemeContext.tsx](file:///c:/Users/Chakshita/OneDrive/Documents/CodeReview%20AI/context/ThemeContext.tsx)
- Provide React context and state for theme (`'dark' | 'light'`) with a toggle function.
- Synchronize CSS classes on the `html` element on change.

#### [MODIFY] [layout.tsx](file:///c:/Users/Chakshita/OneDrive/Documents/CodeReview%20AI/app/layout.tsx)
- Wrap root providers in `ThemeProvider`.
- Add `suppressHydrationWarning` to the `html` tag to avoid theme flash hydration mismatch.

#### [MODIFY] [globals.css](file:///c:/Users/Chakshita/OneDrive/Documents/CodeReview%20AI/app/globals.css)
- Add Light mode/Dark mode theme color CSS variable declarations (`--background`, `--foreground`, `--card`, `--card-border`, `--muted`, `--accent`).
- Apply variables to body and html elements.

#### [MODIFY] Update CSS color classes to variables in components:
- [sidebar](file:///c:/Users/Chakshita/OneDrive/Documents/CodeReview%20AI/components/layout/Sidebar.tsx) (Also adds a toggle button)
- [settings page](file:///c:/Users/Chakshita/OneDrive/Documents/CodeReview%20AI/app/(dashboard)/settings/page.tsx) (Replaces broken theme row with a switch)
- [dashboard page](file:///c:/Users/Chakshita/OneDrive/Documents/CodeReview%20AI/app/(dashboard)/dashboard/page.tsx)
- [new-review page](file:///c:/Users/Chakshita/OneDrive/Documents/CodeReview%20AI/app/(dashboard)/new-review/page.tsx)
- [history page](file:///c:/Users/Chakshita/OneDrive/Documents/CodeReview%20AI/app/(dashboard)/history/page.tsx)
- [chat page](file:///c:/Users/Chakshita/OneDrive/Documents/CodeReview%20AI/app/(dashboard)/chat/page.tsx)
- [profile page](file:///c:/Users/Chakshita/OneDrive/Documents/CodeReview%20AI/app/(dashboard)/profile/page.tsx)
- [developer report component](file:///c:/Users/Chakshita/OneDrive/Documents/CodeReview%20AI/components/review/DeveloperReport.tsx)

## Verification Plan

### Manual Verification
1. Open the settings page, toggle light/dark theme. Verify page background, cards, text color, and border styling changes instantly and persists across refreshes.
2. Type code in the Review Studio editor, wait 2 seconds. Verify "Auto-saved" text appears. Refresh the page and ensure the code is restored.
3. Submit a review. Verify the status message updates dynamically (Streaming Response) as the AI generates it. Once done, verify the code is cleared from auto-save.
4. Navigate to the dashboard. Verify "Live · Updated Just now" is displayed. Create a new review in another tab or finish one and verify the dashboard updates immediately.
