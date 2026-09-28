# Chalk

Live app: https://chalk-case-study-2-p9m9.onrender.com

Code: https://github.com/LyViolz/chalk-case-study-2

## How it works

Browser form → server action → SQLite → wall. The pages and actions run on the server; the browser displays the result. Sign-in stores a session token in SQLite and a cookie. `currentUser` uses that cookie to find the user. Posts are saved as text and formatted when the wall loads. The officer desk checks the role on the server.

## Bug and fix

I signed in as a member and posted `<img src=x onerror=document.title=1>`. In the original app, opening the wall changed the page title to `1`. The Markdown renderer passed raw HTML to `dangerouslySetInnerHTML`, so a post could run JavaScript in a reader's browser.

I escaped HTML, blocked unsafe link URLs, and made the session cookie `HttpOnly`. The payload now appears as text, while normal Markdown still works.

Tests and build pass. I checked posting and officer access on the live app. Render's free plan may reset SQLite data after a restart.
