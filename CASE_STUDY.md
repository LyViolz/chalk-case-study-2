# Chalk case study

## Architecture

```text
Browser form ──POST──> Next.js server action ──SQL──> SQLite
     ↑                    │                         │
     └── HTML/RSC page <──┴── server components <───┘
```

The App Router pages and layout in `app/` are server components. They read SQLite through `lib/db.js` and render HTML/React Server Component output. `lib/actions.js` contains server actions invoked by form submissions. `components/PostBody.js` is a client component; the browser receives its rendered HTML and React hydrates it. The browser also runs the usual Next.js client code, handles forms and navigation, and interprets the post HTML.

At sign-in, `loginAction` checks the email and password through `lib/auth.js`. It creates a random session token, stores the token and user ID in the `sessions` table, and sets the `chalk_session` cookie. On a later request, `currentUser()` reads that cookie using `cookies()` and calls `userFromToken`, which joins `sessions` to `users` and returns the user's ID, email, name, and role. Signing out removes the database session and cookie. The patched cookie is `HttpOnly`, `SameSite=Lax`, and `Secure` in production.

The compose page posts its form to `createPostAction`. That action checks the current user, validates the body length, and inserts the original text into `posts`. The wall reads posts and authors from SQLite, sorts pinned posts first, passes each body through `renderMarkdown`, and gives the resulting HTML to `PostBody`.

Any visitor can read the wall. A signed-in member can compose posts and remove their own posts. An officer also gets an Officer desk link, can remove any post, and can read the private notes in `/mod`. The server checks `user.role` before querying and rendering those notes; hiding the navigation link alone is not the access control.

## Security defect and reproduction

The original `lib/markdown.js` inserted the raw post text into HTML tags without escaping HTML or checking link schemes. `PostBody` then used `dangerouslySetInnerHTML`. This allowed stored cross-site scripting: one member could create a post that executed JavaScript for everyone viewing the public wall. The original session cookie also lacked `HttpOnly`, increasing the impact of a successful script injection.

I reproduced this on the unpatched running app with a disposable local database:

1. Sign in as a member and open `/compose`.
2. Post `<img src=x onerror=document.title=1>`.
3. Open the public wall. The browser's page title changes from `Chalk` to `1`, proving that the post's event handler executed.

A `[click](javascript:alert(1))` link was another unsafe input because the old renderer accepted any link target. It would execute on click.

## Patch

`renderMarkdown` now escapes user text and attribute values before emitting HTML. It recognizes only the supported markdown constructs: headings, lists, bold, italic, code, and links. Link targets must resolve to `http:` or `https:`; unsafe links appear as literal text. The session cookie is now `HttpOnly` and `Secure` in production.

## Verification

- `node --test lib/markdown.test.js`: three passing tests for normal formatting, HTML injection, and links.
- `npm run seed` followed by `npm run build`: successful production build.
- In the patched running app, the previously stored payload appears as text, there is no image element in the post, the page title remains `Chalk`, and the seeded bold formatting still renders.
- Navigating directly to `/mod` as a member shows no private notes. Signing in as an officer shows the desk and its navigation link.

## Hosting

The app needs a persistent writable filesystem for its SQLite database. Use the provided Dockerfile and mount `/app/data` as a persistent volume. The Docker build seeds its database before the Next.js build, and the runtime volume retains accounts and posts. Add the final public URL here after deployment.
