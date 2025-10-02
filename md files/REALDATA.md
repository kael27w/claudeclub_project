# TASK: [P0] Activate Backend with Real Data

**Status:** 📝 TODO
**Assignee:** Claude Code
**Priority:** Highest

## 🎯 Core Objective
The application's backend is currently non-functional and relies exclusively on mock data. This task is to build our first live, end-to-end data pipeline, proving the system can perform real work.

---

## 📜 New Protocol: Verifiable Development

From this point forward, all work must adhere to this protocol.

1.  **Verifiable Development is Mandatory.** A task is only "complete" when you provide concrete, verifiable proof of its functionality with **live data**. Proof includes code snippets, server logs showing successful API calls, and confirmation of specific test cases.
2.  **Documentation as a Blueprint.** Our markdown files are the single source of truth. You will build *exactly* what is specified in them.
    * **Architecture:** @UNIVERSAL_INTELLIGENCE_ARCHITECTURE.md
    * **APIs:** @api.md
    * **Standards:** @CLAUDE.md

---

## 🚧 Phase 0: Prerequisite - System Verification

**This phase is a mandatory blocker. Do not proceed to Phase 1 until this is complete.**

-   [ ] **Create Verifier Script:** Create a new script at `/scripts/api-key-verifier.ts`.
-   [ ] **Implement Verification Logic:** The script must import all API keys from environment variables and perform a simple "hello world" test call for each of the following services:
    -   Perplexity
    -   OpenExchangeRates
    -   Anthropic (Claude)
-   [ ] **Report Results:** The script must log the status of each key (e.g., "✅ Perplexity API Key: VALID"). Provide the full terminal output as proof.

---

## 🚀 Phase 1: Implement Live Currency Conversion

**Objective:** Make the "Live Currency Conversion" component fully functional by connecting it to the **OpenExchangeRates API**.

### Backend Implementation

-   [ ] **Create API Route:** Create a new API route at `apps/api/src/routes/currency/rate.ts`.
-   [ ] **Implement Logic:** The route must accept a `POST` request with `{ baseCurrency: string, targetCurrencies: string[] }`. It must then call the live OpenExchangeRates API and return the real conversion rates in a JSON object. **Do not use mock data.**

### Frontend Integration

-   [ ] **Modify UI Component:** Locate and modify the `Live Currency Conversion` component.
-   [ ] **Implement API Call:** When a user submits a query, the component must:
    1.  Determine the local currency from the destination (e.g., "São Paulo" -> "BRL").
    2.  Call your new `/api/currency/rate` backend route to get the live exchange rate.
    3.  Dynamically update the UI with the fetched data.

---

## ✅ Definition of Done

This task is complete only when you provide all of the following:

-   [ ] **Verifier Script Code:** The complete code for `/scripts/api-key-verifier.ts`.
-   [ ] **Verifier Script Output:** The full terminal output showing the status of all tested API keys.
-   [ ] **Backend Code:** The complete code for the new currency API route.
-   [ ] **Server Log Snippet:** A log showing a successful `[200 OK]` API call to `openexchangerates.org`.
-   [ ] **Frontend Code:** The updated code for the `Live Currency Conversion` component.
-   [ ] **Final Test Confirmation:** A statement confirming that a query for "Barcelona with a €3000 budget" now correctly displays the live USD to EUR exchange rate in the UI.