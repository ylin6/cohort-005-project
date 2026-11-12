# Notification vendors for Cadence: Knock, Novu, Courier, MagicBell, SuprSend

## Question

Cadence (React Router 7 framework mode with SSR, TypeScript, SQLite/Drizzle, Node server) plans to buy a vendor for an in-app **Notification Feed** (React) plus email, for four roles (Student, Instructor, Team Admin, Platform Admin), with hosted self-serve per-person preferences. Email must go through the existing Postmark account. Push, SMS, Slack and marketing/broadcast email are out of scope.

## Scope

- This document records facts only. It does not pick a vendor.
- All sources were read on **2026-11-11**: vendor docs (mostly the `.md` versions served by each docs site), vendor pricing pages, npm registry metadata (`npm view`) and npm tarball contents.
- Where a vendor page did not answer a question, the entry says **unconfirmed**.
- Some pricing-page tables render checkmarks as images, so their per-plan cells could not be read from page text. Those cells are flagged.
- No vendor documents React Router 7 specifically. SSR notes below report what each vendor documents, mostly Next.js `'use client'` guidance. `'use client'` is a React Server Components directive. React Router 7 does not use it unless RSC mode is on. So React Router 7 SSR behaviour is **unconfirmed** for every vendor unless stated otherwise.

## Summary comparison

| Vendor | React Notification Feed | Email via our Postmark | Hosted preferences | Free tier | Entry paid price | Self-host |
|---|---|---|---|---|---|---|
| **Knock** | `@knocklabs/react`: prebuilt `NotificationFeedPopover` / `NotificationFeed` plus hooks. Phoenix-channels websocket. RS256 JWT signed by our server. | Yes. Native Postmark channel. Delivery/bounce status via Postmark webhook. | Yes. Knock-hosted page via signed URL (`default` preference set only), plus API. No prebuilt React preference component (docs give a build-it-yourself example). | 10,000 messages/mo. Unit = 1 message to 1 user on 1 channel. | Starter **$250/mo** incl. 50,000 messages, then $0.005 each | No |
| **Novu** | `@novu/react`: prebuilt `<Inbox />` plus headless hooks. socket.io / websocket. HMAC-SHA256 of subscriberId. | Yes, as a provider. Postmark is **not listed** for email activity (delivery) tracking. | No hosted page found. Prebuilt Preferences view inside `<Inbox />`, a `<Subscription />` component, plus API. | 10,000 workflow runs/mo. Unit = 1 workflow run per subscriber. Max 5 workflows. | Pro **from $30/mo** (30K runs, $1.20 per 1K extra) | Yes. Community self-hosted (MIT outside `enterprise/`). EE self-host on Enterprise. |
| **Courier** | `@trycourier/courier-react` (v9): prebuilt `<CourierInbox />` plus `useCourier()`. Websocket. JWT **issued by Courier's API** (our server calls `/auth/issue-token`). | Yes. Native Postmark integration with MessageStream override. Delivery-status handling for Postmark not described. | Yes. Courier-hosted page plus `<CourierPreferences />` React component. | 10,000 sends/mo. Unit = 1 template to 1 recipient; multi-channel counts as 1. | Business **$0.005 per send from the first send**. No base fee. | No (none found) |
| **MagicBell** | `@magicbell/react` (new) and `@magicbell/magicbell-react` (older line, still published). Client uses SSE/WebSocket. HS256 user JWT. | **Postmark not listed.** Listed: Mailgun, SendGrid, SES, Ping Email, SMTP. | API (`/channels/user_preferences`) plus `UserPreferences` component. No hosted page found. | 1,000 deliveries/mo. Unit = 1 delivery per channel. | Startup **$249/mo** incl. 50,000 deliveries, then $0.0025 each | No (none found) |
| **SuprSend** | `@suprsend/react`: drop-in `Inbox` plus headless hooks. socket.io. ES256 JWT signed by our server. | Yes. Native Postmark vendor. Status via Postmark webhook to SuprSend. | Yes. SuprSend-hosted page (`$hosted_preference_url`) plus headless React methods. **Preferences and hosted page start at Business ($250).** | 10,000 notifications/mo. Unit = 1 notification per channel per user. | Essentials **$100/mo** (50K, $2 per 1K extra). Preferences need Business **$250/mo**. | Enterprise only (self-hosted / BYOC beta) |

---

## Knock

### 1. React Notification Feed components

- **Package:** `@knocklabs/react` (npm 0.15.1, modified 2026-11-06). Prebuilt components are `NotificationFeedPopover`, `NotificationFeed` and `NotificationIconButton`. The SDK also includes "a complete set of React hooks" for headless UI. — https://docs.knock.app/in-app-ui/react/overview
- **Older package:** `@knocklabs/react-notification-feed` (last publish 2025-06-26) has a migration guide to `@knocklabs/react`. It is not marked deprecated on npm. — https://docs.knock.app/in-app-ui/react/overview ; npm registry
- **Providers and CSS:** `KnockProvider` takes `apiKey`, `user` and `userToken`. `KnockFeedProvider` takes `feedId`. Import CSS from `@knocklabs/react/dist/index.css`; the `--rnf-` CSS variables can be overridden. — https://docs.knock.app/in-app-ui/react/feed
- **SSR:**
  - The feed docs page has no SSR guidance. — https://docs.knock.app/in-app-ui/react/feed
  - The published package contains `"use client"` directives (npm tarball 0.15.1).
  - `peerDependencies` include `next` and `@tanstack/react-router`, both marked optional in `peerDependenciesMeta`. — npm registry
  - React Router 7 SSR behaviour: **unconfirmed**.
- **Real-time:**
  - Socket connection, with auto-disconnect for inactive tabs and optional BroadcastChannel cross-tab sync. — https://docs.knock.app/in-app-ui/react/feed
  - `@knocklabs/client` depends on `phoenix` 1.8.9 (Phoenix channels over websocket). — npm registry
- **Browser auth ("enhanced security mode"):**
  - Our server signs a JWT with **RS256** using the private signing key from the Knock dashboard.
  - `sub` = user id is required; `iat` and `exp` are recommended. Optional `grants` scope access to tenants and objects.
  - Enhanced security is **off by default**. While it is off, a public-key request can act as any user. Knock says to enable it before releasing the feed.
  - Token refresh uses `onUserTokenExpiring`.
  - — https://docs.knock.app/in-app-ui/security-and-authentication
- **Token helper (two import paths seen):**
  - The docs page shows `signUserToken` from `@knocklabs/node/lib/tokenSigner`, defaulting to 1-hour expiry. — https://docs.knock.app/in-app-ui/security-and-authentication
  - The current `@knocklabs/node` README imports `signUserToken` (and `buildUserTokenGrant`, `Grants`) directly from `@knocklabs/node`. — npm tarball `@knocklabs/node` 1.41.1 README

### 2. Email via Postmark

- **Setup:** Postmark is a native channel. Configure it per environment with the Postmark API key (server token) and a From address. The From address can use Liquid.
- **Options:** Sandbox mode, Knock or Postmark open/link tracking, and payload overrides (e.g. `{"MessageStream": "broadcasts"}`). The default stream is `outbound`.
- **Delivery tracking:** Add Knock's webhook URL in Postmark for Delivery, Bounce and Spam-complaint events.
- **Limitations:**
  - Only Delivery and Bounce update message status. Spam complaints are logged but do not change status.
  - Recipients need an `email` property.
- **Plan gating:** not stated on the Postmark page.
- — https://docs.knock.app/integrations/email/postmark

### 3. Preferences

- **Model:** Preference keys are `categories`, `channel_types`, `channels` and `workflows`. Conditions are also supported. — https://docs.knock.app/preferences/overview
- **Defaults:** An environment default sits at the lowest priority. A tenant default sits between the user's tenant-specific preferences and the environment default. — https://docs.knock.app/preferences/overview
- **Hosted preference center:**
  - Knock hosts a per-user page at `https://p.knock.app/p/<token>`. The link never expires. Generate it with `POST /v1/users/{user_id}/preference_center/signed_url` or the template var `{{vars.manage_preferences_url}}`.
  - Rows map to a category, workflow or channel in the `default` preference set, with per-channel-type toggles inside category/workflow rows.
  - Branding comes from account branding. A custom domain is supported.
  - **Limits:** user recipients only, with no tenant or object preferences. Top-level channel-type rows are not supported. Conditional rows are read-only.
  - — https://docs.knock.app/preferences/hosted-preference-center
- **Custom/embedded:** For a custom/embedded preference center, the docs give an example that builds your own `PreferenceCenter` component with `@knocklabs/client`. No packaged component was found. — https://docs.knock.app/in-app-ui/react/preferences
- **Plan gating:** "Preferences" is Yes on all plans. **Per-tenant preferences** (admin-set defaults and locked preferences) are **Enterprise only**. — https://knock.app/pricing

### 4. Pricing (https://knock.app/pricing, read 2026-11-11)

- **Billing unit:** a message, defined as "a single message delivered to a single user on a single channel". Bounced and failed messages are not billed. A feed item plus an email for one user is therefore two messages.
- **Free:** $0, up to 10,000 messages. Usage is not hard-capped; Knock contacts you to set up billing.
- **Starter:** **$250/month + usage**. Includes 50,000 messages, then $0.005 each.
- **Enterprise:** custom.
- **Gated features:**
  - "Remove Knock branding": No on Free, Yes on Starter.
  - Per-tenant branding and per-tenant preferences: Enterprise.
  - SAML SSO and SCIM: Enterprise. Google SSO is on all plans.
  - Custom roles, audit logs, i18n, HIPAA: Enterprise.
- **On all plans:** isolated environments are Unlimited. Batching, preferences and custom-provider channels ("Unlimited" delivery channels) are on all plans.
- **Other line items:** Guides (500 recipients free) and agent credits are separate metered items. They are not needed for this scope.

### 5. Node/TypeScript server SDK

- **Package:** `@knocklabs/node` (1.41.1).
- **Trigger:** `await client.workflows.trigger('workflow-key', { recipients: ['user-id'], data: {...} })`. — npm README
- **Recipients:**
  - Can be a full inline object with properties, `channel_data` and `preferences`. Knock identifies the recipient before the run.
  - Plain string ids must already have been identified.
  - Up to 1,000 recipients per trigger. No bulk trigger. `data` max 10MB.
  - — https://docs.knock.app/send-notifications/triggering-workflows/api
- **Tenants:**
  - Pass `tenant` on the trigger. Messages are tagged with the tenant so feeds can be scoped per tenant.
  - Tenant APIs are on all plans. Per-tenant preferences and branding are Enterprise.
  - — https://docs.knock.app/concepts/tenants ; https://docs.knock.app/send-notifications/triggering-workflows/api

### 6. Dev/test

- **Environments:** Development and Production by default, plus custom ones. Each has separate users, messages, logs and API keys. Content is versioned with commits and promoted upward. Channel credentials are not copied to new environments. — https://docs.knock.app/concepts/environments
- **Built-in test email channel:** can only send to members of your Knock account. — https://docs.knock.app/integrations/email/knock-test
- **Sandbox mode:** a per-channel setting (including Postmark) under which "no emails will be sent". — https://docs.knock.app/integrations/email/knock-test ; https://docs.knock.app/integrations/email/postmark
- **Test runner:** the workflow test runner lives in the dashboard. — https://docs.knock.app/send-notifications/testing-workflows
- **CLI:** the Knock CLI supports local-first workflow and resource management. — https://docs.knock.app/developer-tools/knock-cli

### 7. Self-host / license

- No self-host option was found. Pricing lists "Dedicated infrastructure" on Enterprise. — https://knock.app/pricing

### 8. Notable

- **Batching/digest:** a batch step. A batch window can stay open at most 90 days. — https://docs.knock.app/designing-workflows/batch-function
- **Idempotency:**
  - An `Idempotency-Key` header (up to 255 characters) is supported only on `POST /workflows/:key/trigger`.
  - Keys are kept for 24 hours, and only `2xx` responses are cached.
  - `cancellation_key` allows a run to be cancelled later.
  - — https://docs.knock.app/reference ; https://docs.knock.app/send-notifications/triggering-workflows/api
- **Outbound webhooks:** per environment, for events such as message status changes. — https://docs.knock.app/developer-tools/outbound-webhooks/overview
- **Rate limits:** per-endpoint tiers from 1 to 1,000 requests/second, returning `429` when exceeded. The mapping of tiers to endpoints is **unconfirmed** because the table did not render. — https://docs.knock.app/reference
- **EU data residency: not available yet.** Knock's security page says: "We expect to support EU data residency by the end of 2026." — https://docs.knock.app/developer-tools/security

---

## Novu

### 1. React Notification Feed components

- **Packages:**
  - `@novu/react` (3.19.2, modified 2026-09-24) for React 18/19.
  - `@novu/nextjs` for Next.js.
  - `@novu/js` (vanilla JS, built on solid-js). Its dependencies include `socket.io-client` and `partysocket`.
  - — https://docs.novu.co/platform/inbox/react/get-started ; npm registry
- **Prebuilt UI:** `<Inbox />`, which includes a Preferences view. The self-host matrix also lists Bell, Inbox content and Notifications components. — https://docs.novu.co/community/self-hosted-and-novu-cloud
- **Headless:** `NovuProvider` plus `useNotifications`, `useCounts` and `useNovu`. The hooks update in real time. — https://docs.novu.co/platform/inbox/headless-mode
- **Deprecated packages:** `@novu/notification-center` (end of support 2025-04-03) and `@novu/node` (end of support 2025-03-20). — npm registry deprecation notices
- **SSR:**
  - The Next.js example uses `'use client'`. — https://docs.novu.co/platform/inbox/setup-inbox
  - The Vue/Nuxt migration guide says "Inbox does not support server-side rendering" and wraps Nuxt in `<ClientOnly>`. — https://docs.novu.co/platform/inbox/migration-guide
  - The Remix quickstart, the closest page to React Router 7, adds `<Inbox />` to `app/root.tsx` and mentions no SSR caveat. — https://docs.novu.co/platform/quickstart/remix
  - React Router 7 behaviour: **unconfirmed**.
- **Real-time:** websocket. The EU `socketUrl` is `wss://eu.socket.novu.co`. — https://docs.novu.co/platform/inbox/setup-inbox
- **Browser auth (HMAC):**
  - Our server computes `HMAC-SHA256(secretKey, subscriberId)` as lowercase hex and passes it as `subscriberHash`.
  - Enable it with the HMAC toggle on the Novu In-App integration. With HMAC on, the feed does not load without the hash.
  - With contexts (tenants), also pass a `contextHash` of the canonical-JSON context.
  - — https://docs.novu.co/platform/inbox/prepare-for-production
- **Keyless mode:** test-only temporary data that expires after 24h. — https://docs.novu.co/platform/inbox/react/get-started

### 2. Email via Postmark

- **Setup:** Postmark is a supported email provider. Configure the Postmark Server API token and a verified From address in the Integrations page. — https://docs.novu.co/platform/integrations/email/postmark
- **Limitation (delivery tracking):** the email activity-tracking page lists supported providers SendGrid, Mailgun, Resend and Amazon SES. **Postmark is not listed**, so Postmark delivery/bounce events flowing into Novu is **unconfirmed**. — https://docs.novu.co/platform/integrations/email/activity-tracking
- **Not documented on Novu's Postmark page:** MessageStream selection. — https://docs.novu.co/platform/integrations/email/postmark

### 3. Preferences

- **Levels:**
  - Workflow channel defaults, set in the dashboard. All channels are on by default.
  - Subscriber global preferences.
  - Subscriber per-workflow channel preferences.
  - "Critical" workflows cannot be opted out of.
  - — https://docs.novu.co/platform/concepts/preferences
- **UI:**
  - Preferences view inside `<Inbox />`.
  - `<Subscription />` component and headless hooks for topic subscriptions with conditions. — https://docs.novu.co/platform/subscription
  - REST endpoints to read and update preferences.
- **Hosted page:** none found.
- **Email unsubscribe:** Novu adds no unsubscribe link by default. The docs say to build a custom unsubscribe link in your own app. — https://docs.novu.co/platform/integrations/email
- **Tenant scope:** preferences are scoped per subscriber plus tenant context. — https://docs.novu.co/platform/concepts/tenants

### 4. Pricing (https://novu.co/pricing, read 2026-11-11)

- **Billing unit:** a workflow run, defined as "one execution of a workflow for one subscriber".
  - Novu does "not charge per subscriber, per message, or per channel".
  - Runs across **all environments** count.
  - — https://docs.novu.co/platform/subscription/manage-topic-subscriptions ; Novu docs billing FAQ (https://docs.novu.co/platform/account/billing)
- **Free:** $0, 10,000 runs/mo. Up to 5 workflows, 2 environments, 3 team members, 24h activity retention. US + EU data residency.
- **Pro:** from **$30/mo**. 30K runs, $1.20 per 1K extra, 20 workflows, 7-day retention, **Remove Novu branding**.
- **Team:** from **$250/mo**. 250K runs, up to 10 environments, RBAC, 90-day retention.
- **Enterprise:** custom. SAML/OIDC SSO, SCIM, HIPAA, more regions (SG, UK, AU, JP, KR), self-hosted deployment.
- **Digest windows** (from the comparison table text): Free 24h, Pro 7 days, Team 90 days, Enterprise custom. Some checkmark cells in that table could not be read.
- **Outbound webhooks:** Team and Enterprise only. — https://docs.novu.co/platform/developer/webhooks

### 5. Node/TypeScript server SDK

- **Package:** `@novu/api` (3.19.1). `@novu/node` is deprecated.
- **Trigger:** `novu.trigger({ workflowId, to: { subscriberId, email, firstName, ... }, payload })`. Subscriber data can be passed inline in `to`. An EU `serverURL` is available. — https://docs.novu.co/platform/sdks/server/typescript
- **Code-first workflows:** optional, via `@novu/framework`.
- **Multi-tenancy:** via **contexts**. Pass a `tenant` context on trigger and on the Inbox. Feeds and preferences are scoped per subscriber plus tenant. Contexts are auto-created. — https://docs.novu.co/platform/concepts/tenants

### 6. Dev/test

- **Environments:** Development and Production plus custom ones; plan caps apply. — https://docs.novu.co/platform/how-novu-works
- **Demo email/SMS integrations:**
  - Active by default in Cloud.
  - Limited to 300 notifications/mo each.
  - The demo email integration only sends to the logged-in account's address.
  - Not available in self-hosted or local setups.
  - — https://docs.novu.co/platform/integrations/demo-integration
- **Real email in automated tests:** no documented test mode found for keeping a configured provider from sending. **Unconfirmed.**
- **Local:** self-host via Docker, and Framework/CLI local tooling. — https://docs.novu.co/community/self-hosting-novu/overview

### 7. Self-host / license

- **Repo:** `novuhq/novu`, default branch `next`, license file `LICENSE-ENTERPRISE`.
- **License split:** content outside `enterprise/packages` is **MIT**. `enterprise/packages` is under a proprietary "Novu Proprietary Software License" for internal use only. — https://github.com/novuhq/novu (LICENSE-ENTERPRISE via GitHub API)
- **Missing in community self-hosted** (compared with Cloud):
  - custom environments and more than 2 environments
  - email activity tracking
  - remove branding
  - snooze
  - SAML/OIDC SSO, MFA, RBAC, social sign-in
  - translations
  - more than 1 team member ("Max team members: 1")
  - — https://docs.novu.co/community/self-hosted-and-novu-cloud
- **Enterprise self-hosted:** on Enterprise. — https://novu.co/pricing

### 8. Notable

- **Digest:** a digest step. Window caps are plan-dependent (see pricing).
- **Idempotency:**
  - The `Idempotency-Key` is "currently not enabled for all organizations"; contact support to enable it.
  - Duplicates arriving while the first request is in flight get `409`.
  - `transactionId` does **not** deduplicate.
  - — https://docs.novu.co/api-reference/idempotency
- **Outbound webhooks:** Svix-style signatures. Retries for up to 5 days, then the endpoint is disabled. Team and Enterprise only. — https://docs.novu.co/platform/developer/webhooks
- **Rate limits** (trigger, configuration, global):

  | Plan | Trigger | Configuration | Global |
  |---|---|---|---|
  | Free | 60 RPS | 20 RPS | 30 RPS |
  | Pro | 240 RPS | — | — |
  | Team | 600 RPS | — | — |
  | Enterprise | 6K RPS | — | — |

  Bulk calls cost 100 tokens. — https://docs.novu.co/api-reference/rate-limiting
- **EU:** EU region at `eu.api.novu.co` / `wss://eu.socket.novu.co`, listed on the Free plan. — https://docs.novu.co/platform/inbox/prepare-for-production ; https://novu.co/pricing
- **Product direction:** Novu docs now open with "Novu Connect – Agent Communication Infrastructure (ACI)" for AI agents across Slack/Teams/WhatsApp/email/web chat, alongside notifications. — https://docs.novu.co/llms.txt

---

## Courier

### 1. React Notification Feed components

- **Packages:**
  - `@trycourier/courier-react` (9.3.5, modified 2026-11-09) for React 18+.
  - `@trycourier/courier-react-17` for React 17.
- **Components:** `<CourierInbox />`, `<CourierInboxPopupMenu />`, `<CourierToast />` and `<CourierPreferences />`.
- **Headless:** the `useCourier()` hook (client, auth, inbox, toast, preferences) for custom UI.
- — https://www.courier.com/docs/sdk-libraries/courier-react-web
- **Deprecated packages:** `@trycourier/react-inbox`, `@trycourier/react-provider` and others are marked deprecated with "Moved to @trycourier/courier-react". — npm registry ; https://www.courier.com/docs/sdk-libraries/courier-react-v8-migration-guide
- **SSR:**
  - "Courier Inbox and Toast support Next.js but render client-side only"; add `'use client'`. — https://www.courier.com/docs/sdk-libraries/courier-react-web
  - The Next.js guide says `ssr: false` is not needed. The element base class "resolves to a stub under Node, and element registration is guarded on `typeof window`", so importing on the server is safe. — https://www.courier.com/docs/guides/add-an-inbox-to-nextjs
  - React Router 7: **unconfirmed**, but the same import-safety statement applies to the package.
- **Real-time:** a realtime connection that reuses the authenticated JWT session. — https://www.courier.com/docs/in-app/how-the-inbox-behaves
- **Browser auth:**
  - Our server calls Courier's **`POST /auth/issue-token`** with the API key and a scope string (e.g. `user_id:user_123 inbox:read:messages inbox:write:events`) and an `expires_in`.
  - The browser calls `signIn({ userId, jwt, tenantId? })`.
  - The token is minted by Courier's API, not signed locally with a key we hold.
  - — https://www.courier.com/docs/in-app/authenticate-users

### 2. Email via Postmark

- **Setup:** a native Postmark integration. Enter the Server API token and From address. — https://www.courier.com/docs/integrations/email/postmark
- **Overrides:** provider overrides support `MessageStream`, attachments and Postmark templates. — https://www.courier.com/docs/integrations/email/postmark
- **Limitation:** Postmark subject lines are limited to about 60 characters (Courier's note). — https://www.courier.com/docs/integrations/email/postmark
- **Delivery-status tracking:** Courier's Postmark page has no section on Postmark delivery/bounce status. **Unconfirmed.**

### 3. Preferences

- **Model:**
  - Subscription topics are grouped in sections. Each topic has a default of `OPTED_IN`, `OPTED_OUT` or `REQUIRED`.
  - Optional per-section channel selection.
  - Templates are mapped to topics.
  - — https://www.courier.com/docs/guides/build-a-preference-center
- **Precedence:** topic default → parent tenant default → tenant default → user preference → user preference for this tenant. `REQUIRED` short-circuits. — https://www.courier.com/docs/recipients/preferences/overview
- **Hosted page:** served at `https://view.notificationcenter.app/p/<id>` with brand, heading and description. Link to it with `{{$.urls.preferences}}`. — https://www.courier.com/docs/guides/build-a-preference-center
- **Embedded:** the `<CourierPreferences />` React component. — https://www.courier.com/docs/in-app/add-a-preference-center
- **Digest schedules:** can be attached to topics. — https://www.courier.com/docs/guides/build-a-preference-center
- **Plan gating of hosted preferences:** not stated on the pricing page. **Unconfirmed.**

### 4. Pricing (https://www.courier.com/pricing and https://www.courier.com/pricing.md "Last updated: 2026-11-01", read 2026-11-11)

- **Billing unit:** a send, meaning one template to one recipient.
  - A multi-channel template counts as **one** send (e.g. feed plus email = 1 send).
  - "Bounced, undeliverable, and preference-blocked messages count."
  - "Sends from Test and custom environments count."
- **Developer:** free, 10,000 sends/mo. Going over requires Business.
- **Business:** **$0.005 per send**. "Every send is charged, including the first 10,000 of the month." No minimum. Includes EU datacenter, custom tracking domain and AI Translations.
- **Enterprise:** below $0.005/send, plus RBAC, observability integrations, SLA and provider failover.
- **SSO:** Google/GitHub on Developer. "Custom SSO" appears in the comparison table but its plan cell could not be read (checkmark images). **Unconfirmed.**
- **Unreadable comparison-table rows:** "Digest & batching", "Custom environments" and "Multi-tenant support" are rows whose per-plan checkmarks could not be read. The plain-text pricing page does not list them as Enterprise-only. **Unconfirmed.**
- **Branding removal:** not mentioned. **Unconfirmed.**
- **Billing docs:** https://www.courier.com/docs/workspaces/billing

### 5. Node/TypeScript server SDK

- **Package:** `@trycourier/courier` (10.0.0). Runs on Node 20+, Deno, Bun and edge.
- **Send:** `client.send.message({ message: { template, to: { user_id | email, ... }, data } })`.
- **Profiles:** stored with `client.profiles.create/update`. "Create the profile before sending to a `user_id`."
- — https://www.courier.com/docs/sdk-libraries/node
- **Tenants:** name a tenant on the send. Tenants carry brand and `default_preferences`. — https://www.courier.com/docs/guides/notify-across-tenants

### 6. Dev/test

- **Environments:** Production and Test by default, with up to 20 environments per workspace. "Courier has no separate test mode: a Test key is what puts you in the Test environment." — https://www.courier.com/docs/workspaces/environments
- **Test email:** the Test environment comes with a testing email provider preconfigured. — https://www.courier.com/docs/workspaces/environments
- **Sandbox credentials:** the go-live guide recommends a sandbox provider key in each integration's Test configuration. — https://www.courier.com/docs/guides/go-live
- **Billing note:** Test sends are billed. — https://www.courier.com/pricing.md

### 7. Self-host / license

- No self-host option found.
- The client SDKs are public on GitHub (`trycourier/courier-web`). — https://www.courier.com/docs/sdk-libraries/courier-react-web

### 8. Notable

- **Digest and batching:** a topic digest, plus journey digest and batch nodes. — https://www.courier.com/docs/guides/send-a-daily-digest
- **Idempotency:** an `Idempotency-Key` header is supported, and server SDKs take it as a parameter. The retention window is **unconfirmed**. — https://www.courier.com/docs/reference/api-overview
- **Rate limits:**
  - `POST /send` is "not rate-limited by request count".
  - Limited endpoints:
    - list updates: 60 requests/min
    - preference bulk endpoints: 50 requests/s
    - resend: 1 request per 2s per message
  - — https://www.courier.com/docs/reference/api-overview
- **Outbound webhooks:** signed with a `courier-signature` header. — https://www.courier.com/docs/guides/track-delivery
- **EU:**
  - A separate EU datacenter at `api.eu.courier.com`, "available on every paid plan: Business and Enterprise".
  - Data already sent through the US stays in the US.
  - — https://www.courier.com/docs/workspaces/datacenters

---

## MagicBell

### 1. React Notification Feed components

- **Current package:**
  - Docs reference `@magicbell/react` (1.14.0, modified 2026-07-29).
  - Components: `ContextProvider` (from `@magicbell/react/context-provider`), `FloatingInbox`, `Inbox`, `InlineNotification`, `ToastContainer` and `UserPreferences`, among others.
  - The provider takes a required `token` (User JWT).
  - Hooks/headless are not mentioned on the page.
  - — https://www.magicbell.com/docs/libraries/magicbell-react
- **Older line:** `@magicbell/magicbell-react` (11.5.1) and `@magicbell/react-headless` (5.5.1), both last modified 2026-05-22. They are still published and not marked deprecated, but the current docs do not mention them. — npm registry
- **SSR:**
  - The docs have no SSR notes.
  - The `@magicbell/react` 1.14.0 tarball contains many `"use client"` directives.
  - React Router 7: **unconfirmed**.
- **Real-time:**
  - Docs: "MagicBell maintains a persistent connection"; the transport is not named. — https://www.magicbell.com/docs/channels/in_app
  - The `magicbell-js` 1.8.0 client source references `EventSource` (SSE) and `WebSocket`. — npm tarball
- **Browser auth:**
  - A User JWT signed **HS256** with the project Secret Key on our server.
  - Claims: `user_email` and/or `user_external_id`. Examples also include `api_key`.
  - The example expiry is 1 year.
  - — https://www.magicbell.com/docs/api/authentication/user

### 2. Email via Postmark

- **Postmark not listed.** Listed email providers: Mailgun, SendGrid, Amazon SES, Ping Email and SMTP. — https://www.magicbell.com/docs/channels/email
- **API:** the v2 OpenAPI integrations paths match that list (`/integrations/mailgun|sendgrid|ses|ping_email|smtp`). — https://www.magicbell.com/docs/api/openapi.json
- **SMTP route:** whether Postmark can be used through the generic SMTP integration is not documented by MagicBell. **Unconfirmed.**

### 3. Preferences

- **API:** `/channels/user_preferences` (GET/PUT, user JWT). The schema is `categories[] → channels[] { name, enabled }`, i.e. per category × channel. — https://www.magicbell.com/docs/api/openapi.json
- **React:** a `UserPreferences` component. — https://www.magicbell.com/docs/libraries/magicbell-react
- **Hosted page:** none found.
- **Default preferences configuration:** **unconfirmed**.

### 4. Pricing (https://www.magicbell.com/pricing, read 2026-11-11)

- **Billing unit:** a delivery, counted per channel. The pricing FAQ example: 100 users in-app plus 50 of them by email = 150 deliveries.
- **Builder:** $0/mo, 1,000 deliveries/mo, 1 project, unlimited users and team members.
- **Startup:** **$249/mo**, 50,000 deliveries, $0.0025 per extra delivery, 5 projects, $99 per additional project.
- **Enterprise:** custom.
- **Gating of preferences, branding, SSO, environments and EU:** not stated. **Unconfirmed.**

### 5. Node/TypeScript server SDK

- **Package:** `magicbell-js` (1.8.0), using `import { Client } from 'magicbell-js/project-client'` with a project token.
- **Notifications:** created as broadcasts: `client.broadcasts.createBroadcast({ title, content, category, topic, recipients: [{ externalId, email, ... }] })`.
- **Users:** recipients are inline. A separate `saveUser` creates or updates a user.
- — https://www.magicbell.com/docs/libraries/magicbell-js
- **Other package:** the `magicbell` npm package (4.5.1) also exists. Its relationship to `magicbell-js` is **unconfirmed**.
- **Tenants:** no tenant concept found in the v2 OpenAPI paths. "Projects" are a billing unit. **Unconfirmed.**

### 6. Dev/test

- Environments, test mode and sandbox email: **unconfirmed** (not found in docs).
- Projects may serve as separate environments: **unconfirmed**.

### 7. Self-host / license

- No self-host option found.

### 8. Notable

- **Digest/batching:** not found in docs or the v2 OpenAPI. The marketing site has a "Workflows" product page. **Unconfirmed.**
- **Idempotency, rate limits, outbound webhooks, EU hosting:** not found in the v2 docs/OpenAPI. **Unconfirmed.**
- **Docs scope:** the v2 docs are small: about 50 docs URLs in the sitemap, and the API centres on broadcasts and channel tokens. — https://www.magicbell.com/sitemap.xml

---

## SuprSend

### 1. React Notification Feed components

- **Package:**
  - `@suprsend/react` (1.5.0, modified 2026-10-22).
  - Drop-in `Inbox` (popover), plus full-screen and side-sheet feeds.
  - Headless React hooks.
  - Multi-tab stores.
  - — https://docs.suprsend.com/docs/react-inbox-integration ; https://docs.suprsend.com/docs/react-in-app-feed
- **Deprecated package:** `@suprsend/react-inbox` is end-of-support (npm: "Package no longer supported"). The migration moved auth from HMAC `subscriber_id` to signed JWT. — https://docs.suprsend.com/docs/react-inbox-integration ; npm registry
- **Toasts:** not included in `Inbox` by default in `@suprsend/react`. — https://docs.suprsend.com/docs/react-in-app-feed
- **SSR:** no SSR guidance found, and no `"use client"` in the `@suprsend/react` 1.5.0 tarball. Next.js reference apps exist. React Router 7: **unconfirmed**. — https://docs.suprsend.com/docs/keystone-app-guide
- **Real-time:**
  - The feed shows a connection-status dot ("the feed socket is live"). — https://docs.suprsend.com/docs/react-in-app-feed
  - `@suprsend/web-sdk` 5.4.0 depends on `socket.io-client`. — npm registry
- **Browser auth:**
  - Public key plus "enhanced security mode" for production.
  - Our server signs a JWT with **ES256** using the dashboard signing key (PEM).
  - Payload: `entity_type: 'subscriber'`, `entity_id`, `exp`, `iat`, and optional `scope.tenant_id[]`.
  - A `refreshUserToken` callback handles expiry.
  - — https://docs.suprsend.com/docs/client-authentication

### 2. Email via Postmark

- **Setup:** Postmark is a native vendor. Fields: Server Token (required), Account Token (optional), From Name/Email and Reply-To.
- **Status tracking:** add `https://hub.suprsend.com/webhook/postmark/` as a Postmark webhook with all events enabled.
- **Unsubscribe:** templates can use `$hosted_preference_url`.
- — https://docs.suprsend.com/docs/postmark
- **Bring your own provider:** email/SMS require your own vendor accounts on every plan. — https://www.suprsend.com/pricing

### 3. Preferences

- **Levels:** global channel opt-outs (`channel_preferences`), category opt in/out, and per-channel opt-outs within a category. — https://docs.suprsend.com/docs/user-preferences
- **Sub-categories:** "Preferences only work with sub-categories." — https://docs.suprsend.com/docs/user-preferences
- **Defaults:**
  - Precedence: user → tenant default → category default.
  - Per sub-category: On (all or selected channels), Off, or "Can't Unsubscribe" with mandatory channels.
  - — https://docs.suprsend.com/docs/user-preferences
- **Hosted preference page:**
  - Auto-generated once categories are published. Use `{{$hosted_preference_url}}`.
  - Hosted on a SuprSend domain; your own domain is on request.
  - — https://docs.suprsend.com/docs/user-preferences
- **Embedded:**
  - React preferences are headless: `useSuprSendClient` plus preference methods. The example builds its own UI with `react-switch`.
  - No packaged React preference component was found.
  - — https://docs.suprsend.com/docs/preference-react-sdk ; https://docs.suprsend.com/docs/embedded-preference-centre
- **Tenant preferences:** a tenant-level preference API exists. — https://docs.suprsend.com/docs/tenant-preference

### 4. Pricing (https://www.suprsend.com/pricing, read 2026-11-11)

- **Billing unit:** a notification, counted **per channel per user**.
  - Webhook calls count.
  - Notifications SuprSend drops (opt-out, inactive channel) are not billed.
  - A batched/digest notification counts as one.
  - An MTU (user-based) model is available on custom plans.
- **Free:** $0, 10k notifications/mo. The feed carries **SuprSend branding**. Includes a 30-day all-features trial, then the account reverts to Free.
- **Essentials:** **$100/mo** (billed annually at $1,200). 50k/mo, $2 per extra 1,000. Removes SuprSend branding from the feed.
- **Business:** **$250/mo** (billed annually at $3,000). 50k/mo, $5 per extra 1,000. Adds **Batching & Digest, User Preferences** and Objects.
  - The comparison table shows "—" for Free and Essentials on the preference rows, including "Hosted Preference Page".
- **Enterprise:**
  - Multi-tenant data modelling (tenants/multi-tenant templates are also shown as "+ Add-on").
  - SAML SSO, RBAC, audit trail, HIPAA.
  - Custom data-center region / multi-region.
  - Self-hosted, and BYOC (beta).

### 5. Node/TypeScript server SDK

- **Package:** `@suprsend/node-sdk` (1.15.1).
- **Trigger:** `supr_client.workflows.trigger(new WorkflowTriggerRequest(body, { tenant_id, idempotency_key }))`.
- **Recipients:** up to 100 per trigger, given as `distinct_id`s or **inline objects**. Inline objects can carry channels, `$channels` and properties. `is_transient` sends to anonymous recipients.
- — https://docs.suprsend.com/docs/node-trigger-workflow-from-api
- **Tenants:**
  - First-class tenants with per-tenant user profiles and preferences, plus sub-tenants. — https://docs.suprsend.com/docs/tenants
  - Plan gating: multi-tenant is Enterprise or an add-on per pricing. The exact boundary for basic `tenant_id` use is **unconfirmed**.

### 6. Dev/test

- **Default workspaces:** Sandbox, Staging and Production.
  - Sandbox only delivers email/SMS/WhatsApp to up to 5 verified channels per type.
  - Staging supports **Test Mode**: notifications go only to designated internal testers.
  - Custom workspaces are allowed. Credentials are scoped per workspace.
  - — https://docs.suprsend.com/docs/workspaces

### 7. Self-host / license

- Self-hosted deployment and BYOC (beta) are on **Enterprise**. — https://www.suprsend.com/pricing ; https://www.suprsend.com/self-host
- No open-source server license found. **Unconfirmed.**

### 8. Notable

- **Batching/digest:** batch and digest workflow nodes (Business+). — https://docs.suprsend.com/docs/batch ; https://docs.suprsend.com/docs/digest
- **Idempotency:** `idempotency_key` (up to 255 characters) is deduplicated for 24 hours. — https://docs.suprsend.com/docs/node-trigger-workflow-from-api
- **Outbound webhooks:** status events (sent, delivered, seen, etc.), configured in the dashboard. — https://docs.suprsend.com/docs/outbound-webhook
- **EU:**
  - Docs: "We support EU-data residency options". — https://docs.suprsend.com/docs/security
  - The pricing page lists "Custom Data Center Region" as Enterprise. Whether EU is available below Enterprise is **unconfirmed**.
- **Rate limits:** **unconfirmed**.

---

## Facts the vendor choice waits on / open questions

### Differentiators found (no ranking)

1. **Postmark fit.**
   - Knock and SuprSend document Postmark delivery-status webhooks.
   - Courier documents Postmark sending with MessageStream overrides but not status ingestion.
   - Novu supports Postmark sending, but Postmark is not in its activity-tracking provider list.
   - MagicBell does not list Postmark at all.
2. **Hosted per-person preferences.**
   - Knock (all plans; `default` set only, no tenant preferences on the hosted page), Courier and SuprSend (Business $250+) document hosted pages.
   - Novu and MagicBell offer embedded components and API only.
3. **Billing unit.** Under each vendor's unit, one feed item plus one email to one user costs:

   | Vendor | Units used |
   |---|---|
   | Knock | 2 messages |
   | MagicBell | 2 deliveries |
   | SuprSend | 2 notifications |
   | Novu | 1 workflow run |
   | Courier | 1 send |

   - Courier also bills preference-blocked sends and Test-environment sends.
   - Novu bills runs across all environments.
4. **Entry paid price.**

   | Vendor | Entry paid tier |
   |---|---|
   | Novu Pro | $30/mo |
   | Courier Business | $0.005/send, no base fee |
   | SuprSend Essentials | $100/mo (preferences need Business, $250) |
   | MagicBell Startup | $249/mo |
   | Knock Starter | $250/mo |

5. **Who signs the browser token.**

   | Vendor | Token |
   |---|---|
   | Knock | RS256 JWT, signed locally |
   | SuprSend | ES256 JWT, signed locally |
   | MagicBell | HS256 JWT, signed locally |
   | Novu | HMAC-SHA256 of subscriberId, computed locally |
   | Courier | Token minted by Courier's API (network call per issue) |

6. **Team Admin / per-team scoping.**
   - Knock: tenants on all plans, but per-tenant preferences and branding are Enterprise.
   - Novu: contexts.
   - Courier: tenants with tenant default preferences. Plan gating is unreadable on the pricing page.
   - SuprSend: tenants listed as Enterprise or add-on.
   - MagicBell: no tenant concept found.
7. **EU residency.**
   - Novu: EU on Free.
   - Courier: EU on Business+.
   - SuprSend: EU option documented; plan level unconfirmed.
   - Knock: "expected by end of 2026", not yet available.
   - MagicBell: unconfirmed.
8. **Self-host.**
   - Novu: community MIT core with notable limits (1 team member, no SSO/RBAC, no email activity tracking).
   - SuprSend: Enterprise only.
   - Knock, Courier, MagicBell: none found.

### Surprising or recent changes

- **Deprecated React packages:**

  | Vendor | Deprecated package | Replacement |
  |---|---|---|
  | Novu | `@novu/notification-center` (EOS 2025-04-03), `@novu/node` (EOS 2025-03-20) | `@novu/react` / `@novu/js`, `@novu/api` |
  | Courier | `@trycourier/react-inbox` / `react-provider` | `@trycourier/courier-react` v8+ (now v9) |
  | SuprSend | `@suprsend/react-inbox` (end of support; HMAC → JWT) | `@suprsend/react` |
  | Knock | `@knocklabs/react-notification-feed` (superseded, not npm-deprecated) | `@knocklabs/react` |
  | MagicBell | none deprecated; publishes two React lines (`@magicbell/react` and `@magicbell/magicbell-react` / `react-headless`) | docs reference only `@magicbell/react` |

- **Knock EU residency** is still a roadmap item, targeted by end of 2026.
- **Knock enhanced security** is off by default; without it, any user can be impersonated with the public key.
- **Novu idempotency keys** are not on by default; support must enable them. `transactionId` does not deduplicate.
- **Novu has expanded toward AI-agent communication** ("Novu Connect / ACI"). Knock pricing now meters "Guides" and "Agent credits". Courier lists AI nodes and credits. These do not affect the feed/email scope, but they show where the products are heading.
- **Courier's Business plan has no free allowance:** "Every send is charged, including the first 10,000 of the month."
- **SuprSend gates user preferences** (and the hosted preference page) to Business ($250/mo), not the $100 Essentials tier.
- No acquisitions or discontinuations were found on vendor sites for these five vendors (not exhaustively checked).

### Still unknown (need a vendor answer or a spike)

1. **React Router 7 SSR.** Does each feed component import and server-render safely in React Router 7 framework mode, or does it need a client-only boundary (`lazy` / `useEffect` mount)? Only Courier states server import is safe (for Next.js). Novu states Inbox does not support SSR (Vue/Nuxt context).
2. **Postmark status ingestion** for Novu and Courier. Postmark via SMTP for MagicBell.
3. **Courier plan gating** for tenants, digests, custom environments and the hosted preference page. The pricing table checkmarks were unreadable.
4. **Knock rate-limit tiers** per endpoint.
5. **Novu:** how to stop real email in CI when a real provider is configured.
6. **MagicBell:** environments, outbound webhooks, idempotency, digest, EU, tenants.
7. **SuprSend:** rate limits, EU availability below Enterprise, and whether basic `tenant_id` use needs the add-on.
8. **Data migration/export** for each vendor if Cadence later switches (not researched).

---

## Sources (all read 2026-11-11)

### Knock

- https://knock.app/pricing
- https://docs.knock.app/in-app-ui/react/overview
- https://docs.knock.app/in-app-ui/react/feed
- https://docs.knock.app/in-app-ui/react/preferences
- https://docs.knock.app/in-app-ui/security-and-authentication
- https://docs.knock.app/integrations/email/postmark
- https://docs.knock.app/integrations/email/knock-test
- https://docs.knock.app/preferences/overview
- https://docs.knock.app/preferences/hosted-preference-center
- https://docs.knock.app/concepts/tenants
- https://docs.knock.app/concepts/environments
- https://docs.knock.app/send-notifications/triggering-workflows/api
- https://docs.knock.app/send-notifications/testing-workflows
- https://docs.knock.app/designing-workflows/batch-function
- https://docs.knock.app/developer-tools/outbound-webhooks/overview
- https://docs.knock.app/developer-tools/security
- https://docs.knock.app/developer-tools/knock-cli
- https://docs.knock.app/reference
- npm: `@knocklabs/react`, `@knocklabs/client`, `@knocklabs/node`, `@knocklabs/react-notification-feed`

### Novu

- https://novu.co/pricing
- https://docs.novu.co/llms.txt
- https://docs.novu.co/platform/inbox/react/get-started
- https://docs.novu.co/platform/inbox/setup-inbox
- https://docs.novu.co/platform/inbox/headless-mode
- https://docs.novu.co/platform/inbox/prepare-for-production
- https://docs.novu.co/platform/inbox/migration-guide
- https://docs.novu.co/platform/quickstart/react
- https://docs.novu.co/platform/quickstart/remix
- https://docs.novu.co/platform/integrations/email
- https://docs.novu.co/platform/integrations/email/postmark
- https://docs.novu.co/platform/integrations/email/activity-tracking
- https://docs.novu.co/platform/integrations/demo-integration
- https://docs.novu.co/platform/concepts/preferences
- https://docs.novu.co/platform/concepts/tenants
- https://docs.novu.co/platform/concepts/trigger
- https://docs.novu.co/platform/subscription
- https://docs.novu.co/platform/subscription/manage-topic-subscriptions
- https://docs.novu.co/platform/how-novu-works
- https://docs.novu.co/platform/sdks/server/typescript
- https://docs.novu.co/platform/developer/webhooks
- https://docs.novu.co/api-reference/rate-limiting
- https://docs.novu.co/api-reference/idempotency
- https://docs.novu.co/community/self-hosted-and-novu-cloud
- https://github.com/novuhq/novu (LICENSE-ENTERPRISE)
- npm: `@novu/react`, `@novu/js`, `@novu/api`, `@novu/node`, `@novu/notification-center`, `@novu/framework`

### Courier

- https://www.courier.com/pricing
- https://www.courier.com/pricing.md
- https://www.courier.com/docs/workspaces/billing
- https://www.courier.com/docs/sdk-libraries/courier-react-web
- https://www.courier.com/docs/sdk-libraries/courier-react-v8-migration-guide
- https://www.courier.com/docs/guides/add-an-inbox-to-nextjs
- https://www.courier.com/docs/in-app/authenticate-users
- https://www.courier.com/docs/in-app/how-the-inbox-behaves
- https://www.courier.com/docs/in-app/add-a-preference-center
- https://www.courier.com/docs/integrations/email/postmark
- https://www.courier.com/docs/guides/build-a-preference-center
- https://www.courier.com/docs/recipients/preferences/overview
- https://www.courier.com/docs/guides/notify-across-tenants
- https://www.courier.com/docs/guides/go-live
- https://www.courier.com/docs/guides/track-delivery
- https://www.courier.com/docs/guides/send-a-daily-digest
- https://www.courier.com/docs/workspaces/environments
- https://www.courier.com/docs/workspaces/datacenters
- https://www.courier.com/docs/reference/api-overview
- https://www.courier.com/docs/sdk-libraries/node
- npm: `@trycourier/courier-react`, `@trycourier/courier`, `@trycourier/react-inbox`, `@trycourier/react-provider`

### MagicBell

- https://www.magicbell.com/pricing
- https://www.magicbell.com/docs
- https://www.magicbell.com/docs/libraries/magicbell-react
- https://www.magicbell.com/docs/libraries/magicbell-js
- https://www.magicbell.com/docs/api/authentication/user
- https://www.magicbell.com/docs/channels/email
- https://www.magicbell.com/docs/channels/in_app
- https://www.magicbell.com/docs/dashboard
- https://www.magicbell.com/docs/api/openapi.json
- https://www.magicbell.com/sitemap.xml
- npm: `@magicbell/react`, `@magicbell/magicbell-react`, `@magicbell/react-headless`, `magicbell-js`, `magicbell`

### SuprSend

- https://www.suprsend.com/pricing
- https://www.suprsend.com/self-host
- https://docs.suprsend.com/docs/react-inbox-integration
- https://docs.suprsend.com/docs/react-in-app-feed
- https://docs.suprsend.com/docs/client-authentication
- https://docs.suprsend.com/docs/postmark
- https://docs.suprsend.com/docs/user-preferences
- https://docs.suprsend.com/docs/embedded-preference-centre
- https://docs.suprsend.com/docs/preference-react-sdk
- https://docs.suprsend.com/docs/tenants
- https://docs.suprsend.com/docs/tenant-preference
- https://docs.suprsend.com/docs/workspaces
- https://docs.suprsend.com/docs/node-trigger-workflow-from-api
- https://docs.suprsend.com/docs/outbound-webhook
- https://docs.suprsend.com/docs/security
- https://docs.suprsend.com/docs/batch
- https://docs.suprsend.com/docs/digest
- https://docs.suprsend.com/docs/keystone-app-guide
- npm: `@suprsend/react`, `@suprsend/react-inbox`, `@suprsend/web-sdk`, `@suprsend/node-sdk`
