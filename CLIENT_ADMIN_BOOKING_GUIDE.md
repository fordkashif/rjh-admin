# Royale Jazz Hotel
# Admin Dashboard User Guide

This guide is written for the hotel team and explains how to use the admin dashboard day to day.

It covers:

- logging in
- company and hotel setup
- how user roles work
- how to give staff access
- how to manage bookings
- how the booking process works from request to check-out
- what each admin section is used for

## 1. Admin Dashboard Overview

The Royale Jazz admin dashboard is the internal workspace used to manage:

- company branding
- hotel information
- reservations
- guest history
- room inventory
- staff access

Depending on the user’s role, they will see different pages and options.

## 2. Main Admin Sections

The dashboard includes these main areas:

- `Company`
- `Dashboard`
- `Reservations`
- `Guests`
- `Rooms`
- `Properties`
- `Staff Access`

Not every user will see all of these sections.

## 3. User Roles

There are three user roles in the current system:

1. `Owner`
2. `Manager`
3. `Front Desk`

Each role has a different level of access.

### Owner

Owners have full access to the company and hotel workspace.

Owners can:

- update company branding
- manage company contact information
- add hotels
- manage reservations
- manage guests
- manage rooms
- manage hotel properties/content
- grant or revoke staff access

### Manager

Managers have operational access, but not company-level access.

Managers can:

- use the dashboard
- manage reservations
- manage guest history
- manage rooms
- manage hotel properties/content

Managers cannot:

- access the `Company` page
- manage `Staff Access`

### Front Desk

Front desk users are focused on guest arrivals, departures, and live reservation handling.

Front desk can:

- use the dashboard
- manage reservations
- view guest history
- manage room assignment and room status

Front desk cannot:

- access the `Company` page
- access `Properties`
- manage `Staff Access`

## 4. Role Access Table

| Section | Owner | Manager | Front Desk |
|---|---|---|---|
| Company | Yes | No | No |
| Dashboard | Yes | Yes | Yes |
| Reservations | Yes | Yes | Yes |
| Guests | Yes | Yes | Yes |
| Rooms | Yes | Yes | Yes |
| Properties | Yes | Yes | No |
| Staff Access | Yes | No | No |

## 5. Logging In

Each staff member needs their own login.

When a user signs in:

- Owners are taken first to the `Company` page
- Managers and Front Desk users are taken to the `Dashboard`

The login screen and admin look can be branded with:

- company name
- subtitle
- logo
- primary color
- accent color

If no company logo has been added yet, the login page will not show one.

## 6. How To Get A User Into The System

Before a staff member can be given hotel access, they must already have a valid login account in the authentication system.

That means there are two steps:

1. the user must exist as a login user
2. the user must then be granted access to the hotel

### Recommended Staff Setup Process

1. Create the staff member’s login account
2. Confirm the staff member can sign in
3. Log in as an `Owner`
4. Open `Staff Access`
5. Enter the staff email
6. Choose the correct role
7. Save

Once this is done, the user will only see the pages allowed for their role.

## 7. Staff Access Management

Only Owners can manage staff access.

The `Staff Access` page is used to:

- grant access to a hotel
- change a staff member’s role
- revoke access from a hotel

### To Add A Staff Member

1. Open `Staff Access`
2. Enter the user’s email address
3. Choose the role:
   - `Owner`
   - `Manager`
   - `Front Desk`
4. Click `Grant Access`

### To Change A Role

The easiest method is to grant access again using the same email and a new role. The system will update the role.

### To Remove Access

Use the `Remove` or revoke action beside that staff member.

## 8. Company Management

The `Company` page is owner-only.

This page allows the owner to manage the company identity used across the admin dashboard.

### Owners Can Update

- company/brand name
- admin subtitle
- logo URL
- primary color
- accent color
- support email
- support phone

These settings affect:

- the admin shell
- the login page
- the browser tab title
- the overall brand feel of the admin

## 9. Adding A Hotel

Owners can also add hotels from the `Company` page.

### Hotel Information That Can Be Added

- hotel name
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

When a hotel is created, the owner who creates it is automatically attached to that hotel as an Owner.

## 10. Dashboard

The dashboard is the operational summary page.

It is designed to help staff quickly understand what is happening today.

Typical information shown there includes:

- total reservations
- arrivals today
- unassigned arrivals
- in-house stays
- occupancy snapshot
- recent activity
- upcoming arrivals

This page is especially useful at shift handover.

## 11. Reservations

The `Reservations` page is the main booking management area.

This is where staff can:

- view reservations
- filter reservations by status
- add a reservation manually
- edit a reservation
- assign a room
- confirm or cancel a reservation
- check a guest in
- check a guest out
- delete a reservation

## 12. Booking Lifecycle

The booking lifecycle is the step-by-step path a reservation follows.

Current statuses are:

1. `Pending`
2. `Confirmed`
3. `Checked In`
4. `Checked Out`

There is also:

- `Cancelled`

### Pending

This means the request exists but has not yet been fully accepted into the stay workflow.

Staff can:

- confirm it
- cancel it

### Confirmed

This means the booking has been accepted and is expected to arrive.

Staff can:

- assign a room
- check the guest in
- cancel it if needed

Important note:

- a guest should not be checked in until a room is assigned

### Checked In

This means the guest is currently staying in the hotel.

Staff can:

- check the guest out

### Checked Out

This means the stay is complete.

### Cancelled

This means the reservation will not continue.

## 13. How To Add A Reservation Manually

Use this for:

- phone bookings
- walk-ins
- front desk direct bookings

### Steps

1. Open `Reservations`
2. Click `Add Reservation`
3. Enter:
   - guest name
   - guest email
   - guest phone
   - source
   - status
   - room type
   - dates
   - adults / children
   - room count
   - nightly rate
   - total amount
   - notes
4. Assign a room if available
5. Save the reservation

If the booking is created as `Confirmed`, the reservation enters the expected-arrival workflow immediately.

## 14. How Public Booking Requests Are Handled

When a booking request comes from the public website, staff should process it from `Reservations`.

### Recommended Process

1. Open `Reservations`
2. Filter to `Pending`
3. Review:
   - guest details
   - dates
   - room type
   - number of guests
   - notes
4. Confirm that space is available
5. Assign a room when appropriate
6. Click `Confirm`

If the reservation is confirmed, the system can trigger the guest confirmation email flow.

## 15. How To Assign A Room

Room assignment should be done once the correct room is known.

### Steps

1. Find the reservation
2. Use the room assignment control
3. Choose the correct room
4. Save/update

Important:

- the room must belong to the same hotel as the reservation
- room assignment should be completed before check-in

## 16. How To Check A Guest In

### Steps

1. Open the reservation
2. Make sure a room is assigned
3. Confirm the guest has arrived
4. Click `Check In`

Once checked in:

- the reservation moves to in-house status
- the room can be tracked against the active stay

## 17. How To Check A Guest Out

### Steps

1. Open the reservation
2. Confirm departure
3. Click `Check Out`
4. Update room status and housekeeping in `Rooms` if needed

This completes the stay lifecycle.

## 18. Guests

The `Guests` page is the guest history section.

It helps staff track:

- guest contact information
- number of stays
- total spend
- preferred channel
- notes
- whether the guest currently has an active stay

This page is useful for:

- repeat guest recognition
- service continuity
- internal notes and guest context

## 19. Rooms

The `Rooms` section manages both:

- room types
- physical room inventory

### Room Types

Room type setup includes:

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
- capacity
- amenities
- active/inactive state

### Room Inventory

Room inventory setup includes:

- room type
- room code
- floor
- occupancy
- status
- housekeeping state

### Common Room Statuses

- Available
- Occupied
- Reserved
- Maintenance
- Blocked

### Common Housekeeping States

- Clean
- Inspected
- Dirty
- In Progress

## 20. Properties

The `Properties` page is available to Owners and Managers.

This section is used for hotel-related configuration and content management.

Front Desk users do not have access to this section.

## 21. Emails And Notifications

Some reservation actions can trigger guest email communication.

Typical examples include:

- reservation confirmed
- reservation cancelled

The team should still always verify that the booking itself is correct in the dashboard, even when automated email is enabled.

## 22. Daily Operations Workflow

Below is a recommended daily operating routine.

### Start Of Day

1. Open `Dashboard`
2. Review:
   - arrivals today
   - unassigned arrivals
   - in-house guests
   - recent activity
3. Open `Reservations`
4. confirm room assignments for arrivals

### During The Day

1. Handle new bookings
2. confirm pending requests
3. assign rooms
4. check guests in
5. update room readiness

### End Of Day

1. review in-house guests
2. check out completed stays
3. update housekeeping statuses
4. leave notes for the next shift

## 23. Quick Reference By Role

### Owner

- manages company setup
- manages hotel list
- manages staff access
- has full operational visibility

### Manager

- oversees reservations, rooms, and guests
- supports hotel setup and day-to-day operations
- does not manage company branding or staff access

### Front Desk

- handles live guest operations
- works in reservations, rooms, and guest history
- does not manage staff access or company setup

## 24. Suggested Screenshots To Add

If you want this guide turned into a polished client handoff PDF, the best screenshots to add are:

1. Login page
2. Company page
3. Dashboard
4. Reservations page
5. Add Reservation form
6. Rooms page
7. Staff Access page

## 25. Quick Start Checklist

### Owner Setup Checklist

1. Log in
2. Open `Company`
3. Add company branding
4. Add support email and phone
5. Add hotel records
6. Grant staff access

### Reservations Checklist

1. Review pending requests
2. Confirm valid bookings
3. Assign rooms
4. Check in arrivals
5. Check out departures
6. Keep room statuses current

### Staff Setup Checklist

1. Make sure the user has a login account
2. Open `Staff Access`
3. Enter the email
4. choose role
5. Grant access

## 26. Important Notes

- Each staff member should have their own login.
- Staff access is hotel-specific.
- A room should be assigned before check-in.
- Owners are the only users who can manage company branding and staff permissions.
- Front Desk users are intentionally limited to daily operational tools only.

