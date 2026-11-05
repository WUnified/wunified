# Community Events Screen

The Community tab renders the Events view from Figma frame `24:5`. Its search,
calendar, Discover/My Events tabs, and event cards are composed in
`src/features/community/screens/CommunityScreen.tsx`.

## Data and RSVP behavior

Events and RSVPs are loaded through the Community feature API and
`src/lib/db/events.ts`. Events are ordered by start time. The RSVP query first gets
the current Supabase Auth user and filters `event_rsvps.user_id` to that ID; database
RLS remains an additional boundary. Only `going` and `maybe` RSVPs count as active.
The feature API joins those records to events by event ID and removes duplicate
events.

Discover shows all events. My Events filters the same loaded event list to active
RSVPs, including past events. RSVP and cancellation updates persist to
`event_rsvps`; the hook reflects successful changes immediately and retries failed
loads without reloading on tab changes.

The schema has no event image or attendee-count fields. Cards therefore use the
event's title, description, location, and timestamps rather than assigning
unrelated sample images or fabricated attendance counts. Calendar markers come
from event start dates.

## Filters and creation

The filter sheet combines case-insensitive location matching with a date range
mode (any date, upcoming, or past) based on `location` and `start_time`. These
filters apply to the currently loaded list and preserve the existing chronological
sort; the screen does not currently paginate events.

The create form uses the required `title`, `description`, `location`, and
`start_time` columns and the optional `end_time`. Date/time fields are entered as
local `YYYY-MM-DD` and 24-hour `HH:MM` values and converted to ISO timestamps.
Created events are standalone (`club_id` is null); the optional club relationship
is not exposed because this screen does not offer a club-membership picker. The
repository derives `created_by` from the authenticated Supabase user, and event
insertion remains subject to the existing authenticated insert policy and RLS.
