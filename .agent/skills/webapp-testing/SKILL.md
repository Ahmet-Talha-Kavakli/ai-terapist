---
name: webapp-testing
description: Toolkit for testing local web applications using Playwright. Use this skill whenever testing UI functionality, debugging frontend behavior, capturing screenshots, verifying user flows, writing automated browser tests, or checking that the app works correctly in the browser. Use when asked to "test", "verify", "check if it works", or "debug" any web interface.
---

# Web Application Testing

Test local web applications by writing native Python Playwright scripts.

## Decision Tree: Choosing Your Approach

```
User task → Is it static HTML?
├─ Yes → Read HTML file directly to identify selectors
│  ├─ Success → Write Playwright script using selectors
│  └─ Fails/Incomplete → Treat as dynamic (below)
│
└─ No (dynamic webapp) → Is the server already running?
   ├─ No → Start dev server first: npm run dev
   │  Then use Playwright with the running server URL
   └─ Yes → Reconnaissance-then-action:
      1. Navigate and wait for networkidle
      2. Take screenshot or inspect DOM
      3. Identify selectors from rendered state
      4. Execute actions with discovered selectors
```

## Starting the Dev Server

For this project (Next.js), start the server with:
```bash
npm run dev
# Server runs at http://localhost:3000
```

Then write your Playwright automation targeting `http://localhost:3000`.

## Basic Playwright Pattern

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)  # Always headless
    page = browser.new_page()
    page.goto('http://localhost:3000')
    page.wait_for_load_state('networkidle')  # CRITICAL: Wait for JS to execute

    # Take screenshot for inspection
    page.screenshot(path='/tmp/inspect.png', full_page=True)

    # Inspect DOM
    content = page.content()
    buttons = page.locator('button').all()

    # Interact
    page.click('button[data-testid="start-session"]')
    page.fill('input[name="email"]', 'test@example.com')

    browser.close()
```

## Reconnaissance-Then-Action Pattern

Always inspect before acting on dynamic apps:

```python
# Step 1: Inspect the rendered state
page.goto('http://localhost:3000/session')
page.wait_for_load_state('networkidle')
page.screenshot(path='/tmp/step1.png', full_page=True)

# Step 2: Find selectors from inspection
buttons = page.locator('button').all_text_contents()
print("Buttons found:", buttons)

# Step 3: Execute with discovered selectors
page.click('text=Start Session')
page.wait_for_selector('[data-testid="avatar"]')
page.screenshot(path='/tmp/step2.png')
```

## Common Test Scenarios for This App

### Test Login Flow
```python
page.goto('http://localhost:3000/login')
page.wait_for_load_state('networkidle')
page.fill('input[type="email"]', 'test@example.com')
page.fill('input[type="password"]', 'testpassword')
page.click('button[type="submit"]')
page.wait_for_url('**/dashboard')
assert '/dashboard' in page.url
```

### Test Session Start
```python
page.goto('http://localhost:3000/dashboard')
page.wait_for_load_state('networkidle')
page.click('text=Start New Session')
page.wait_for_selector('[data-testid="session-view"]', timeout=10000)
page.screenshot(path='/tmp/session-view.png')
```

### Test Responsive Design
```python
# Mobile viewport
page.set_viewport_size({"width": 375, "height": 812})
page.goto('http://localhost:3000')
page.screenshot(path='/tmp/mobile.png')

# Desktop viewport
page.set_viewport_size({"width": 1440, "height": 900})
page.screenshot(path='/tmp/desktop.png')
```

## Best Practices

- **Always wait for `networkidle`** before interacting — never race conditions
- **Use descriptive selectors** in order of preference:
  1. `data-testid="..."` attributes (most stable)
  2. `role=` + `name=` (accessible)
  3. `text=` visible text
  4. CSS selectors (least preferred — brittle)
- **Always close the browser** when done
- **Screenshot on failure** — helps debug what went wrong
- **Use `page.wait_for_selector()`** instead of `page.wait_for_timeout()` (time-based waits are flaky)

## Common Pitfall

❌ Don't inspect DOM before waiting for networkidle on dynamic apps:
```python
page.goto('http://localhost:3000')
content = page.content()  # ❌ React hasn't rendered yet!
```

✅ Always wait first:
```python
page.goto('http://localhost:3000')
page.wait_for_load_state('networkidle')  # ✅ Now JS has executed
content = page.content()
```
