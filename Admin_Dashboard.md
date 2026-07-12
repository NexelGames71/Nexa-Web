Build Production-Ready Nexa AI Admin Dashboard

You are working on the Nexa AI Admin Dashboard for Nexa Labs. The existing dashboard already has the following admin pages:

Overview / Training Operations
Users and Roles
Models
Analytics
Billing
Support

Some pages are partially built. Your task is to upgrade the entire admin dashboard into a production-ready, modern SaaS admin system, not a beta-style prototype. The interface should feel premium, clean, live, animated, and operational, similar to high-end admin dashboards used by Stripe, Linear, Vercel, OpenAI, Supabase, and Cloudflare.

The current visual direction is clean and minimal with white/soft-gray backgrounds, rounded cards, subtle shadows, left sidebar navigation, large page headings, stat cards, and data-driven admin content. Keep that clean Nexa style, but make it feel more polished, more alive, and more complete.

Core Goal

Build a full admin control center for Nexa AI where administrators can:

Monitor user activity.
Manage users, roles, consent, and account health.
Track model performance across text, image, voice, embedding, and automation models.
View live analytics with animated charts and real-time dashboard updates.
Manage plans, subscriptions, invoices, and PayPal billing.
Handle support tickets, escalations, account issues, and customer context.
Control training exports, consent status, dataset readiness, and model-improvement pipelines.

The final result must look like a real production SaaS dashboard ready for launch.

Global Design Requirements

Upgrade the UI across all pages using a consistent Nexa Admin design system.

Use:

Clean white and off-white backgrounds.
Soft gray borders.
Rounded cards.
Subtle shadows.
Smooth hover states.
Dark primary action buttons.
Green status badges for healthy/completed/active states.
Red/orange badges for warnings, failed jobs, billing issues, blocked accounts, and escalations.
Compact but readable typography.
Proper spacing and alignment.
Strong visual hierarchy.
Responsive layout for desktop, tablet, and mobile.
Sticky left sidebar on desktop.
Collapsible sidebar on smaller screens.
Skeleton loaders for loading states.
Empty states for pages with no data.
Error states for failed API requests.
Toast notifications for important admin actions.
Confirmation modals for destructive actions.
Search, filtering, sorting, and pagination where needed.

The dashboard should not feel static. Add subtle motion:

Card fade-in on page load.
Animated number counters for stats.
Smooth chart animations.
Real-time pulse indicators.
Live refresh badges.
Hover lift effects on cards.
Slide-in detail panels.
Animated status badges.
Progress bars for usage and model health.
Loading shimmer states.
Smooth tab transitions.

Use animations carefully. The UI should feel alive, not distracting.

Technical Requirements

Implement using the existing project stack. Do not rewrite the whole app unless necessary.

Follow these rules:

Reuse existing components where possible.
Create reusable admin components instead of duplicating UI.
Keep pages clean and modular.
Use real data sources where already available.
Use typed interfaces for dashboard data.
Add mock fallback data only when backend data does not exist yet.
Clearly separate mock data from production API data.
Do not hard-code sensitive values.
Do not expose admin-only routes to regular users.
Ensure admin pages are protected by proper authentication and role checks.
Use environment variables for PayPal credentials.
Add loading, error, and empty states for all async data.
Make sure all buttons either work or are clearly disabled with proper “Coming soon” handling.
Do not leave dead buttons with no action.
Improve accessibility: semantic HTML, labels, keyboard navigation, focus states, readable contrast.
Layout Structure

The admin dashboard should have a consistent shell:

Left Sidebar

Include:

Nexa AI logo / admin mark
Overview
Users
Models
Analytics
Billing
Support
Optional: Training, Settings, Audit Logs, System Health if useful
Signed-in admin section
Back to chat button

Improve the sidebar with:

Better active state styling
Icons for each section
Collapsible behavior
Hover states
Clean spacing
Optional compact mode
Top Header Area

Each page should have:

Eyebrow label, such as ADMIN, TRAINING OPERATIONS, SYSTEM COMMAND
Page title
Short description
Right-side actions, such as Refresh, Export, Add, Create, Pause Live, etc.
Admin account badge
Live refresh indicator where relevant
Page 1 — Overview / Training Operations

Upgrade the current Consent and Export Control overview page into a complete training operations control room.

It should show:

Main Stats
Total users
Opted-in users
Opted-out users
Eligible conversations
Eligible messages
Latest export count
Latest export status
Dataset readiness score
Training data growth this week
Consent rate

Use animated counters and status badges.

Consent Summary

Show:

Opt-in rate
Latest export status
Last completed export
Latest watermark
Latest export files
Latest export scope
Excluded users
Export eligibility rules
Latest Export Snapshot

Show:

Export name
Export type: manual, incremental, full
Status: completed, running, failed, queued
Examples
Messages
Files
Started time
Completed time
Download bundle action
View logs action
Export Queue

Build a working export queue UI:

Run full export
Run incremental export
Queue status
Running jobs
Completed jobs
Failed jobs
Retry failed export
Cancel running export
View export logs
Download Bundle

Create a section for signed export download links:

Generate signed link
Link expiry
Copy link
Download JSONL
Download ZIP
Download metadata
Warning that exports contain sensitive training data
Dataset Health

Add a new panel showing:

Duplicate message rate
Empty message rate
Average prompt length
Average response length
Unsafe/redacted items count
Consent-excluded items
Ready for fine-tuning: yes/no
Recommended next action
Page 2 — Users and Roles

Upgrade the Users and Roles page into a complete user-management system.

Top Stats

Show:

Total users
Opted in
Email verified
Phone verified
Blocked
Admin users
Active 24h
New users this week
Directory Table

The user table should support:

Search by name, email, user ID, label
Filter by status: active, invited, blocked, deleted
Filter by consent: opted in, opted out, unknown
Filter by verification: email verified, phone verified
Filter by role: user, admin, support, moderator
Sort by created date, last login, message count, consent status
Pagination
Row hover states
Click row to open selected user panel

Columns:

User
Email
Role
Consent
Email verified
Phone verified
Last login
Created
Labels
Status
Actions
Selected User Panel

Improve the right-side selected user card into a full admin profile panel.

Show:

Name
Email
User ID
Role
Created date
Last login
Email verified
Phone verified
Current plan
Subscription status
Consent status
Last opt-in
Last opt-out
Preference updated
Labels
Message count
Conversation count
Storage usage
Account flags

Actions:

Edit role
Add label
Remove label
Block user
Unblock user
Reset consent
View conversations
View billing profile
Open support history
Export user data
Delete or anonymize account, behind confirmation modal
Roles and Permissions

Add a role management section or tab:

Admin
Support
Billing manager
Model operator
Read-only analyst
Regular user

Each role should show permissions:

View analytics
Manage users
Manage billing
Run exports
View training data
Manage models
Handle support tickets
Modify plans
Page 3 — Models

The current Models page is only a placeholder. Build it out fully.

This should become the Model Operations Center for Nexa AI.

The page should track all model types:

Text generation models
Image generation models
Voice / TTS models
Speech-to-text models
Embedding models
Moderation models
Browser automation / agent models
Fine-tuned models
Experimental models
Main Model Stats

Show top-level cards:

Total models
Active models
Offline models
Models in training
Total tokens today
Total image generations today
Average latency
Error rate
Total cost estimate
GPU usage
Queue depth
Fine-tune jobs
Model Registry Table

Create a model registry table with:

Model name
Type
Provider: Nexa local, OpenAI, Hugging Face, Replicate, custom, etc.
Status: active, standby, training, failed, disabled
Version
Context window
Max output tokens
Input tokens used
Output tokens used
Requests today
Average latency
Error rate
Cost estimate
Last updated
Actions

Actions:

View details
Enable
Disable
Set as default
Route traffic
View logs
Edit limits
Delete model, with confirmation
Model Detail Drawer

When selecting a model, open a slide-in drawer showing:

Model name
Model type
Description
Provider
Endpoint/backend
Status
Version
Context length
Token limits
Temperature defaults
Rate limits
Plan availability
Supported features
Usage today
Usage this month
Latency chart
Error chart
Cost chart
Recent requests
Health logs
Text Generation Models

Track:

Fast model
Think model
Deep Think model
Coding model
Reasoning model
RAG model
Long-context model

For each, show:

Token usage
Context limit
Average response time
Average output length
Failures
Timeout rate
User satisfaction, if available
Which plans can access it
Image Generation Models

Track:

Image model name
Image size support
Queue time
Generations today
Failed generations
Average render time
Storage used by generated images
NSFW/moderation rejects
Cost per generation estimate
Training dataset status
Caption dataset status
Voice Models

Track:

TTS voices
STT models
Voice conversation latency
Audio minutes generated
Audio minutes transcribed
Failed voice requests
Supported languages
Default voice
Premium voices
Model Routing

Add a section for routing traffic:

Route Fast mode to selected model
Route Think mode to selected model
Route Deep Think mode to selected model
Route image generation to selected image model
Route voice to selected TTS/STT model
Rollout percentage
Fallback model
Failover strategy

Example:

90% Fast traffic → Ember 0.5
10% Fast traffic → Ember 1.0 experimental
Fallback → previous approved Nexa model
Plan Access Controls

Allow admins to configure model access by plan:

Free
Plus
Pro
Premium
Business
Enterprise

For each plan, control:

Allowed models
Daily token limit
Monthly token limit
Image generation limit
Voice minute limit
Context window cap
Max output token cap
Priority queue access
Model Health

Add live charts:

Requests per minute
Average latency
Error rate
Token throughput
GPU memory usage
Queue depth
Cold starts
Timeout count

Use animated charts and live refresh.

Page 4 — Analytics

The current Analytics page is strong, but it needs to become more complete and production-ready.

Build a Live Engagement Command Center.

Top Stats

Show:

Total users
Active 24h
Active 7d
Active 30d
Conversations
Messages
Average messages per session
Message velocity
Conversation starts
Retention rate
Top user share
Peak hour
Live System Pulse

Improve the existing pulse card.

Show:

Live refresh timer
Last updated timestamp
Current active users
Weekly active users
Peak hour
Top user share
Message velocity
Conversation growth
System health
API health
Model latency

Add:

Pause live
Refresh now
Auto-refresh interval selector: 15s, 30s, 60s, 5m
Charts

Build animated charts for:

Message velocity, 7-day trend
Conversation starts, 7-day trend
Active users, 7-day trend
Hourly message flow, last 24 hours
Contribution stack by user
Model usage by mode
Token usage over time
Image generations over time
Voice usage over time
Subscription conversion funnel
Retention cohort
Error rate
Average latency

Charts should animate on load and update smoothly during live refresh.

User Activity Insights

Show:

Top users by messages
Top users by conversations
New users
Dormant users
Power users
Users with support issues
Users with billing issues
Users opted into training
Users opted out of training
Operational Insights

Show:

Busiest hour
Slowest model
Most used model
Fastest-growing feature
Highest-error feature
Training data growth
Model cost estimate
Storage growth
API usage growth
Export Analytics

Allow:

Export CSV
Export JSON
Export PDF report later
Date range picker
Filter by plan, model, user segment, feature
Page 5 — Billing

The Billing page is currently a placeholder. Build it into a full billing and subscription admin center using PayPal as the payment gateway.

Billing Overview Stats

Show:

Total customers
Active subscriptions
Trial users
Monthly recurring revenue
Failed payments
Canceled subscriptions
Revenue this month
Refunds
Average revenue per user
Plan distribution
Plans

Create plan cards for Nexa subscriptions.

Use these plan names unless the existing app already uses another final naming system:

Free / Starter
Plus
Pro
Premium
Business
Enterprise

Each plan should include:

Monthly price
Included tokens
Included image generations
Included voice minutes
Included storage
Max context limit
Available models
Priority level
API access rules
Team seats
Support level

Admins should be able to:

Create plan
Edit plan
Disable plan
Mark plan as public/private
Set PayPal plan ID
Set monthly price
Set yearly price
Set trial length
Set usage limits
PayPal Integration

Implement PayPal subscription support.

Use environment variables:

PayPal client ID
PayPal secret
PayPal webhook ID
PayPal environment: sandbox or live

Build backend/API support for:

Create PayPal product
Create PayPal billing plan
Start subscription checkout
Capture subscription approval
Verify PayPal webhook signatures
Handle subscription activated
Handle payment completed
Handle payment failed
Handle subscription canceled
Handle subscription suspended
Handle subscription expired
Sync PayPal subscription status to Nexa user account
Store PayPal customer/subscription references securely

Do not expose secrets in the frontend.

Billing Table

Create a subscription/customer table with:

Customer
Email
Plan
PayPal subscription ID
Status
Current period start
Current period end
Renewal date
Amount
Failed payment count
Created
Actions

Actions:

View billing details
Change plan
Cancel subscription
Reactivate subscription
Sync with PayPal
View invoices/payments
Apply manual credit
Mark account billing issue
Invoices and Payments

Show:

Payment history
Invoice ID
PayPal transaction ID
Amount
Currency
Status
Paid date
Failed reason
Refund status
Usage-Based Tracking

Track usage by user and plan:

Text tokens
Image generations
Voice minutes
Storage
API calls
Browser automation runs
RAG/document processing
Overages

Show progress bars:

Used tokens / limit
Used images / limit
Used voice minutes / limit
Used storage / limit
Billing Alerts

Create alerts for:

Failed payments
Subscription canceled
User exceeded quota
PayPal webhook failed
Plan misconfigured
Missing PayPal plan ID
Revenue drop
High usage user
Page 6 — Support

The Support page is currently a placeholder. Build it into a real support operations page.

Support Overview Stats

Show:

Open tickets
Resolved tickets
Escalated tickets
Average response time
SLA risk
Enterprise tickets
Billing tickets
Technical issues
Account issues
Ticket Inbox

Create a support ticket table/list with:

Ticket ID
User
Subject
Category
Priority
Status
Assigned admin
Created
Last updated
SLA timer
Actions

Filters:

Open
Pending
Resolved
Escalated
Billing
Technical
Account
Enterprise
High priority
Ticket Detail Panel

When a ticket is selected, show:

User profile summary
Ticket subject
Full message
Category
Priority
Status
Conversation history
Internal notes
Attachments
Related conversations
Related billing issue
Related model errors
SLA timer

Actions:

Reply
Add internal note
Assign ticket
Escalate
Mark pending
Mark resolved
Link conversation
Link billing profile
Block abusive user
Create follow-up task
Customer Context

Show useful customer information:

Current plan
Subscription status
Usage level
Recent errors
Last login
Last conversation
Consent status
Account flags
Support history
Support Analytics

Show:

Tickets by category
Tickets by priority
Average response time
Resolution time
SLA breaches
Support load over time
Top issue types
Extra Page Suggestions

Add these only if they fit the existing structure cleanly.

System Health

Track:

API status
Database status
Appwrite status
Storage status
PayPal webhook status
Model backend status
Queue workers
Export worker
RAG worker
Image generation worker
Voice worker
Audit Logs

Track admin actions:

User role changed
User blocked
Export generated
Model disabled
Plan updated
Subscription canceled
PayPal sync triggered
Support ticket modified

Each audit log should include:

Admin
Action
Target
Timestamp
IP/device if available
Metadata
Data and Backend Requirements

Connect the dashboard to real backend sources where possible.

Expected backend data sources may include:

Appwrite users
Appwrite database documents
Training export metadata
Conversation/message records
Consent preferences
Model configuration records
Usage records
PayPal subscription records
Support ticket records
Admin audit logs

Create or update database collections/tables as needed:

Suggested Collections
users_profile
userId
displayName
email
role
status
labels
plan
subscriptionStatus
createdAt
lastLoginAt
emailVerified
phoneVerified
user_consent
userId
optedIn
optedInAt
optedOutAt
preferenceUpdatedAt
source
model_registry
modelId
name
type
provider
status
version
contextWindow
maxOutputTokens
endpoint
defaultTemperature
planAccess
createdAt
updatedAt
model_usage
modelId
userId
mode
requestCount
inputTokens
outputTokens
latencyMs
errorCount
costEstimate
createdAt
billing_plans
planId
name
priceMonthly
priceYearly
currency
paypalProductId
paypalPlanId
limits
features
isPublic
status
subscriptions
subscriptionId
userId
planId
paypalSubscriptionId
status
currentPeriodStart
currentPeriodEnd
renewalDate
cancelAt
createdAt
updatedAt
payments
paymentId
userId
subscriptionId
paypalTransactionId
amount
currency
status
paidAt
failureReason
support_tickets
ticketId
userId
subject
message
category
priority
status
assignedAdminId
createdAt
updatedAt
resolvedAt
support_notes
noteId
ticketId
adminId
note
visibility
createdAt
admin_audit_logs
logId
adminId
action
targetType
targetId
metadata
createdAt
UX Quality Bar

The dashboard must feel like a real product.

Do not produce:

Empty placeholder cards
Generic “Coming soon” pages
Buttons that do nothing
Random chart data without labels
Crowded layout
Weak typography
Poor spacing
Inconsistent badges
Inconsistent cards
Overly bright colors
Unclear table actions
Broken mobile layout
Unprotected admin pages

Every page should have enough structure that Nexa admins can actually use it.

Component Requirements

Create reusable components:

AdminShell
AdminSidebar
AdminHeader
StatCard
MetricCard
StatusBadge
LiveRefreshBadge
DataTable
SearchFilterBar
ChartCard
DetailDrawer
ConfirmModal
EmptyState
LoadingSkeleton
ErrorState
UsageProgress
PlanCard
ModelStatusCard
TicketCard
AuditLogRow

Use a consistent component API so future admin pages can be added easily.

Animation Requirements

Use a clean animation system.

Animations should include:

Page transition fade/slide
Card stagger animation
Stat number count-up
Chart draw-in animation
Badge pulse for live/running status
Button hover lift
Drawer slide-in
Modal fade/scale
Table row hover
Skeleton loading shimmer
Toast slide-in

Avoid heavy animations that slow the dashboard down.

Security Requirements

This is an admin system. Implement proper safeguards.

Protect all admin routes.
Check admin role server-side where possible.
Do not rely only on frontend checks.
Never expose PayPal secrets to the client.
Validate all admin actions.
Log all sensitive admin actions.
Add confirmation modals for destructive actions.
Redact sensitive user data where appropriate.
Ensure training exports respect user consent.
Exclude opted-out users from export datasets.
Do not allow support users to access billing or model controls unless permission allows it.
Use least-privilege role access.
PayPal Subscription Implementation Details

Build the PayPal integration in a production-ready way.

Required Environment Variables

Use names like:

PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=
PAYPAL_ENV=sandbox
Required Features
Create PayPal access token server-side.
Create products/plans or store existing PayPal plan IDs.
Start checkout for subscriptions.
Confirm approved subscription.
Webhook endpoint for PayPal events.
Verify webhook signature.
Update Nexa subscription status when PayPal sends events.
Store subscription IDs and transaction IDs.
Show billing status in admin dashboard.
Show failed payments.
Allow manual sync with PayPal.
PayPal Events to Handle

Handle at minimum:

BILLING.SUBSCRIPTION.CREATED
BILLING.SUBSCRIPTION.ACTIVATED
BILLING.SUBSCRIPTION.CANCELLED
BILLING.SUBSCRIPTION.SUSPENDED
BILLING.SUBSCRIPTION.EXPIRED
PAYMENT.SALE.COMPLETED
PAYMENT.SALE.DENIED
PAYMENT.SALE.REFUNDED

Use the correct current PayPal event names supported by the SDK/API version being used in this project.

Acceptance Criteria

The task is complete only when:

All admin pages have production-quality layouts.
The Models page is fully built, not a placeholder.
The Billing page is fully built with PayPal subscription structure.
The Support page is fully built with tickets, details, and customer context.
Analytics has animated charts and live-refresh behavior.
Users page has search, filters, selected-user panel, and role handling.
Overview page has training export controls, consent stats, and dataset health.
All pages have loading, error, and empty states.
All major actions have working handlers or clean mocked handlers with clear TODOs.
The UI is responsive.
The visual design is consistent across pages.
The app has no TypeScript errors.
The app builds successfully.
No admin page still looks like a generic beta placeholder.
PayPal secrets are server-only and never exposed to the frontend.
Admin permissions are enforced.
Sensitive actions are logged in audit logs.
Implementation Order

Work in this order:

Review existing admin routes, components, data sources, and styling.
Create or improve the shared admin design system.
Upgrade the global admin shell and sidebar.
Upgrade Overview / Training Operations.
Upgrade Users and Roles.
Build Models page fully.
Upgrade Analytics with live animated charts.
Build Billing page with PayPal subscription architecture.
Build Support page with ticket system layout.
Add shared loading, error, empty, modal, drawer, toast, and table components.
Add responsive behavior.
Add admin authorization checks.
Add audit logging for sensitive actions.
Test every page.
Run lint/build/typecheck and fix all errors.
Final Output Expected

When finished, provide:

Summary of changed files.
New components created.
New routes/pages improved.
Backend/API changes made.
PayPal integration status.
Any environment variables required.
Any database collections/tables required.
Any known limitations or TODOs.
Confirmation that the app builds successfully.

Do not stop at placeholder UI. Build the dashboard as if Nexa AI is preparing for real users, real subscriptions, real model tracking, real support, and real admin operations.
