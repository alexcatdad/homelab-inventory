# Homelab Inventory — Hosted SaaS MVP Design

## Overview

Launch a hosted SaaS version of Homelab Inventory that's free to use, with optional supporter tiers for those who want to contribute.

## Positioning

**Tagline**: "A homelab inventory tool you'll actually enjoy using."

**Why this exists**: I tried existing tools but couldn't find one that clicked for me. So I built something simple and beautiful that I actually wanted to use. Maybe you'll like it too.

**Target users**: Enthusiasts with 1-100 devices who are overwhelmed by hoarded IT equipment and need to make sense of what they have.

## Business Model

| Tier | Price | What they get |
|------|-------|---------------|
| Free | $0 | Full access, no limits, no feature gates |
| Monthly Supporter | TBD | Badge on profile, listed on Supporters page |
| One-time Supporter | TBD | Badge on profile, listed on Supporters page |

**Future**: Open source for self-hosting once the hosted version is stable.

---

## Landing Page

### Hero Section
- **Headline**: "A homelab inventory tool you'll actually enjoy using"
- **Subheadline**: "Track your gear. Visualize your network. Stop forgetting what you have."
- **CTA**: "Get Started — Free"
- Screenshot of dashboard with sample data

### Feature Grid (6 items)
| Feature | Description |
|---------|-------------|
| Dashboard | See your entire homelab at a glance |
| Network Topology | Visualize how everything connects |
| Storage Overview | Track drives across all devices |
| AI Spec Lookup | Auto-fill device specifications |
| Multi-language | English & Romanian (more coming) |
| Responsive | Works on desktop, tablet, mobile |

### Supporters Section
- "Support the Project" explanation
- Link to supporters page

### Footer
- Privacy Policy, Terms of Service
- GitHub link (once open sourced)
- "Made by [creator] for the homelab community"

---

## Onboarding Flow

### Step 1: Sign Up
- User clicks "Get Started" on landing page
- GitHub OAuth authentication
- Redirect to dashboard

### Step 2: Sample Data Welcome
Dashboard loads with pre-populated enthusiast homelab:
- Proxmox server (with specs, RAM, storage drives)
- TrueNAS box (multiple drives)
- 3x Raspberry Pi cluster
- Managed switch
- Firewall/router (pfSense or OPNsense)
- 2-3 IoT devices
- Network connections between devices

Banner at top: "This is sample data. Explore, then clear it when ready."

### Step 3: User Takes Over
- "Clear Sample Data" button in banner or settings
- Clears all sample devices, user starts fresh
- OR user can delete samples one by one

---

## Supporter System

### Supporters Page (`/supporters`)
- Public page listing all supporters
- Badge indicator: "Monthly Supporter" vs "One-time Supporter"
- "These cool people keep the project alive"
- Link to become a supporter

### In-App Recognition
- Badge visible on user profile/account
- Different styles for monthly vs one-time

### Payment
- Stripe integration for subscriptions and one-time payments
- Ko-fi / GitHub Sponsors / Buy Me a Coffee as alternatives for donations

---

## Legal Documents

### Privacy Policy

> **Your data, your stuff**
>
> We use GitHub OAuth for sign-in, so we never see or store your password. We don't manage accounts — GitHub does.
>
> The only data we store is what you put into the app: your devices, specs, and network info. None of this is uniquely identifiable to you — it's just your gear.
>
> **Deleting your data**: Request it, and it's gone automatically.
>
> **Exporting your data**: Available anytime. Exports run on a schedule, so give it a moment.
>
> **Infrastructure**: We use Convex for our backend. Your data lives there.
>
> That's it. We don't sell your data. We don't share it. It's yours.

### Terms of Service

> **The basics**
>
> Don't spam. Don't hack. Don't be a jerk.
>
> **No guarantees**
>
> This is a passion project. Things might break. We'll do our best, but no promises.
>
> **No refunds**
>
> Supporter payments are donations to keep the project alive. No refunds, but you can cancel anytime.
>
> **We're all figuring this out**
>
> We're not lawyers, just homelab nerds sharing a tool. Be cool and we'll be cool.

---

## Implementation Checklist

### To Build
- [ ] Landing page (hero, feature grid, supporters section, footer)
- [ ] Supporters page (public list with badges)
- [ ] Sample data system (seed on signup, "Clear" button)
- [ ] Payment integration (Stripe for monthly + one-time)
- [ ] Profile badges (show supporter status in-app)
- [ ] Privacy Policy page
- [ ] Terms of Service page
- [ ] Data deletion flow (auto-delete on request)
- [ ] Data export improvements (if needed)

### Already Exists
- [x] GitHub OAuth
- [x] Multi-language support (English, Romanian)
- [x] Device CRUD + network topology
- [x] Data export functionality
- [x] Responsive UI

---

## Open Questions

- Supporter pricing (monthly): $3? $5?
- One-time donation minimum: $5? Any amount?
- Domain name: homelab-inventory.com? Other?
