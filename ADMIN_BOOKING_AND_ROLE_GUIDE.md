# Royale Jazz Admin Guide

This guide explains how the Royale Jazz admin works today: who can access what, how to get a user into the system, how bookings are managed, and what the booking lifecycle looks like from start to finish.

This document is based on the current admin routes, role checks, and service logic in the codebase as of May 14, 2026.

## Admin Areas

The admin currently has these main sections:

- `Company`
- `Dashboard`
- `Reservations`
- `Guests`
- `Rooms`
- `Properties`
- `Staff Access`

The route permissions are enforced in:

- [index.jsx](/Users/abigailsubarney/Downloads/Almaris/hotel-admin-vite/package/src/jsx/index.jsx:1)
- [Menu.jsx](/Users/abigailsubarney/Downloads/Almaris/hotel-admin-vite/package/src/jsx/layouts/nav/Menu.jsx:1)
- [HotelContext.jsx](/Users/abigailsubarney/Downloads/Almaris/hotel-admin-vite/package/src/context/HotelContext.jsx:136)

## User Roles

There are three hotel roles in the current system:

1. `owner`
2. `manager`
3. `front_desk`

These roles are enforced in the database and the admin UI.

Database role validation is defined in:

- [security_hardening.sql](/Users/abigailsubarney/Downloads/Almaris/supabase/security_hardening.sql:124)

### Owner

Owners have the highest level of access within a company.

Owners can access:

- `Company`
- `Dashboard`
- `Reservations`
- `Guests`
- `Rooms`
- `Properties`
- `Staff Access`

Owners can also:

- update company branding
- control the admin colors, title, and support details
- add hotels to the company
- grant and revoke staff access

The owner-only company actions are backed by:

- [company_branding_and_owner_management.sql](/Users/abigailsubarney/Downloads/Almaris/supabase/company_branding_and_owner_management.sql:1)

### Manager

Managers are operations users. They can run the hotel day to day but cannot manage company-level branding or staff permissions.

Managers can access:

- `Dashboard`
- `Reservations`
- `Guests`
- `Rooms`
- `Properties`

Managers cannot access:

- `Company`
- `Staff Access`

### Front Desk

Front desk users are focused on live stay operations and reservation handling.

Front desk can access:

- `Dashboard`
- `Reservations`
- `Guests`
- `Rooms`

Front desk cannot access:

- `Company`
- `Properties`
- `Staff Access`

## Role Matrix

| Area | Owner | Manager | Front Desk |
|---|---|---|---|
| Company | Yes | No | No |
| Dashboard | Yes | Yes | Yes |
| Reservations | Yes | Yes | Yes |
| Guests | Yes | Yes | Yes |
| Rooms | Yes | Yes | Yes |
| Properties | Yes | Yes | No |
| Staff Access | Yes | No | No |

## How To Get A User Into The System

This part is important: staff access can only be granted to a person who already exists in Supabase Auth.

The current staff access flow does **not** create an auth user from scratch. It only links an existing auth user to a hotel.

That check is enforced in:

- [security_hardening.sql](/Users/abigailsubarney/Downloads/Almaris/supabase/security_hardening.sql:131)

If the email does not exist in `auth.users`, the grant will fail.

### Recommended Process For New Staff

1. Create or invite the user into Supabase Auth first.
2. Confirm that the user can sign in.
3. Log in as an owner.
4. Open `Staff Access`.
5. Enter the existing staff email.
6. Choose the role:
   - `Owner`
   - `Manager`
   - `Front Desk`
7. Click `Grant access`.

The admin screen used for this is:

- [StaffAccess.jsx](/Users/abigailsubarney/Downloads/Almaris/hotel-admin-vite/package/src/jsx/components/Operations/StaffAccess.jsx:1)

The RPC/service used is:

- [staffAccessService.js](/Users/abigailsubarney/Downloads/Almaris/hotel-admin-vite/package/src/services/staffAccessService.js:1)

### What Happens When Access Is Granted

When access is granted:

- the email is matched to an existing auth user
- a `user_hotel_access` row is inserted or updated
- the hotel role is stored for that user
- a staff access notification email is sent

## Owner Landing Flow

When an owner logs in, they are redirected to `Company` first instead of the generic dashboard.

That behavior is configured in:

- [index.jsx](/Users/abigailsubarney/Downloads/Almaris/hotel-admin-vite/package/src/jsx/index.jsx:50)

This is intentional because owners need a place to:

- set company name
- set admin subtitle
- add a logo URL
- set primary and accent colors
- add support email and phone
- add hotels to the company

## Company Management

Owners manage the company from the `Company` page:

- [Company.jsx](/Users/abigailsubarney/Downloads/Almaris/hotel-admin-vite/package/src/jsx/components/Operations/Company.jsx:1)

### Company Branding Controls

Owners can set:

- brand name
- admin subtitle
- logo URL
- primary color
- accent color
- support email
- support phone

These values affect:

- the admin shell brand
- the login screen
- the document title / browser tab title
- shell styling variables used by the admin

### Adding A Hotel

Owners can also create a new hotel from the same page.

Hotel creation currently supports:

- name
- short name
- code
- city
- country
- website label
- website URL
- timezone
- description
- contact phone
- contact email

When a hotel is created:

- the hotel is inserted into `public.hotels`
- the current owner is automatically granted `owner` access to that hotel

That logic lives in:

- [company_branding_and_owner_management.sql](/Users/abigailsubarney/Downloads/Almaris/supabase/company_branding_and_owner_management.sql:62)

## Login Page Behavior

The login page is designed to read from the company branding snapshot when available.

Important current behavior:

- if no company logo has been added yet, no logo is shown
- branding colors and company copy drive the visual presentation
- the browser tab title is updated from company branding

Relevant files:

- [Login.jsx](/Users/abigailsubarney/Downloads/Almaris/hotel-admin-vite/package/src/jsx/pages/Login.jsx:1)
- [adminBranding.js](/Users/abigailsubarney/Downloads/Almaris/hotel-admin-vite/package/src/lib/adminBranding.js:1)

## Booking Management Overview

The booking workflow is centered around `Reservations`.

Main screen:

- [Reservations.jsx](/Users/abigailsubarney/Downloads/Almaris/hotel-admin-vite/package/src/jsx/components/Operations/Reservations.jsx:1)

Core reservation service logic:

- [hotelOperationsService.js](/Users/abigailsubarney/Downloads/Almaris/hotel-admin-vite/package/src/services/hotelOperationsService.js:447)

### What Reservations Screen Handles

The reservations screen currently lets staff:

- view all reservations for the selected hotel
- filter by status
- create a reservation manually
- edit a reservation
- assign a room
- confirm a pending reservation
- cancel a reservation
- check in a confirmed reservation
- check out an in-house reservation
- delete a reservation

## Detailed Booking Process

This section explains the full lifecycle.

### 1. A Reservation Enters The System

Reservations can enter the system in two main ways:

1. Public booking/request flow from the frontend
2. Manual creation in the admin by hotel staff

For manual admin creation, the reservation form captures:

- guest name
- guest email
- guest phone
- booking source
- status
- room type
- assigned room (optional)
- check-in date
- check-out date
- adults
- children
- room count
- nightly rate
- total amount
- notes

### 2. The Reservation Record Is Created

When a reservation is created in admin:

- a reservation row is inserted into `public.reservations`
- a `reservation_guests` row is inserted
- a guest profile is synced or created
- an assigned room can optionally be linked immediately
- if the status is `confirmed` or `cancelled`, the guest status email flow is triggered

This happens in:

- [hotelOperationsService.js](/Users/abigailsubarney/Downloads/Almaris/hotel-admin-vite/package/src/services/hotelOperationsService.js:492)

### 3. Guest Profile Sync

Guest profiles are not just standalone cards. They are driven by reservation activity.

When reservation data is created or edited, the system syncs guest information into guest profiles so the hotel can see:

- stay history
- total spend
- preferences
- notes
- active stay context

The `Guests` page is therefore a history and operations view built from reservation activity:

- [Guests.jsx](/Users/abigailsubarney/Downloads/Almaris/hotel-admin-vite/package/src/jsx/components/Operations/Guests.jsx:1)

### 4. Room Assignment

A reservation does not always need to be assigned immediately, but check-in should not happen without a room.

When a room is assigned:

- the reservation’s `assigned_room_id` is updated
- the system checks that the room belongs to the same hotel
- an audit log entry is written

This is handled in:

- [hotelOperationsService.js](/Users/abigailsubarney/Downloads/Almaris/hotel-admin-vite/package/src/services/hotelOperationsService.js:447)

### 5. Reservation Status Lifecycle

The implemented status flow is:

1. `pending`
2. `confirmed`
3. `checked_in`
4. `checked_out`

There is also:

- `cancelled`

### Pending

This usually means:

- a request exists
- it has not yet been formally accepted into an active stay workflow

Available actions:

- confirm
- cancel

### Confirmed

This means:

- the reservation is approved
- it is expected to arrive

Available actions:

- check in
- cancel

Important rule:

- the UI disables `Check in` if no room is assigned

### Checked In

This means:

- the guest is currently in house

Available action:

- check out

### Checked Out

This means:

- the stay is complete

### Cancelled

This means:

- the reservation will not proceed

### Status Email Triggers

The system sends guest emails when:

- a reservation is created as `confirmed`
- a reservation is created as `cancelled`
- an existing reservation is updated to `confirmed`
- an existing reservation is updated to `cancelled`

This is driven through the reservation status email function from the admin service layer.

## What Staff Should Do In Daily Booking Operations

### For A New Walk-In Or Phone Booking

1. Open `Reservations`
2. Click `Add reservation`
3. Enter guest details
4. Choose the room type
5. Set stay dates
6. Set adults, children, room count, nightly rate, and total
7. Assign a room if one is ready
8. Save as `confirmed`
9. If the guest is already arriving, check in after room assignment

### For A Public Reservation Request

1. Open `Reservations`
2. Filter by `Pending`
3. Review dates, room type, guest details, and notes
4. Confirm availability
5. Assign a room when appropriate
6. Click `Confirm`
7. The guest confirmation email should send automatically

### For Arrival Day

1. Check today’s arrivals on the dashboard
2. Review unassigned arrivals
3. Open reservation
4. Assign room if needed
5. Click `Check in`

### For Departure Day

1. Review in-house reservations
2. Confirm the room is departing
3. Click `Check out`
4. Update housekeeping and room status if needed in `Rooms`

## Rooms Management

The `Rooms` area is split between room types and actual inventory.

Main screen:

- [Rooms.jsx](/Users/abigailsubarney/Downloads/Almaris/hotel-admin-vite/package/src/jsx/components/Operations/Rooms.jsx:1)

### Room Types

Room type management includes:

- code
- title
- description
- hero image
- form image
- gallery images
- size label
- bed label
- best-for label
- rate label
- rate note
- display order
- max adults
- max children
- base rate
- amenities
- active/inactive state

### Room Inventory

Inventory management includes:

- room type
- room code
- floor
- occupancy
- status
- housekeeping state

### Room Statuses

Common room states shown in the UI:

- available
- occupied
- reserved
- maintenance
- blocked

### Housekeeping States

Housekeeping states shown in the UI include:

- clean
- inspected
- dirty
- in progress / other transitional values

## Properties Screen

The `Properties` area is available to:

- owner
- manager

Front desk does not have access.

This screen is intended for hotel-specific configuration and content management.

## Staff Access Screen

The `Staff Access` area is owner-only.

Use it when you need to:

- grant a user hotel access
- change a user’s hotel role by re-granting with a new role
- revoke a user’s hotel access

Current supported role choices in the UI:

- `Manager`
- `Front Desk`
- `Owner`

## Dashboard Summary

The dashboard is an operations view for all active hotel roles.

It is designed to surface:

- total reservations
- arrivals today
- unassigned arrivals
- in-house count
- occupancy snapshot
- recent activity
- upcoming arrivals

The dashboard is best used as the daily handoff screen for:

- front desk
- managers
- owners checking live operations

## Browser Tab / Company Info

The admin browser tab title now uses company branding rather than generic text.

That means once the owner sets:

- brand name
- subtitle

the admin should present itself as the company’s own dashboard.

## Suggested Screenshot Sections

Screenshots were requested, but they are best captured after the latest admin build is deployed so the guide matches the final live UI exactly.

Recommended screenshots to add later:

1. Login page
2. Owner `Company` page
3. `Staff Access` page
4. `Reservations` table
5. `Add reservation` modal
6. `Rooms` page with inventory table
7. `Dashboard` summary cards

## Quick Start Checklist

### For Owners

1. Log in
2. Open `Company`
3. Set brand name, colors, and support details
4. Add hotel records if needed
5. Open `Staff Access`
6. Grant users access by email

### For Managers

1. Open `Dashboard`
2. Review arrivals and pending work
3. Manage `Reservations`
4. Review `Guests`
5. Maintain `Rooms`
6. Update `Properties` as needed

### For Front Desk

1. Open `Dashboard`
2. Review arrivals
3. Manage `Reservations`
4. Assign rooms
5. Check guests in and out
6. Review `Guests`
7. Update room states in `Rooms`

## Important Operational Notes

- A staff member must already exist in auth before hotel access can be granted.
- Owners are the only users who can manage company branding and staff access.
- Managers cannot manage staff access.
- Front desk cannot access company or property configuration sections.
- Check-in should be done only after room assignment.
- Confirmed and cancelled reservation states can trigger guest emails.
