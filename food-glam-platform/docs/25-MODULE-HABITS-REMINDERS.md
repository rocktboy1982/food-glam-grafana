# Module: Habits + Reminders

## Purpose
Support behavior change: meal prep, weigh-ins, hydration.

## Features
- Habit checklist (daily)
- Optional reminders (email/push later)

## DB
### `habits`
- `id` uuid pk
- `owner_id` uuid
- `name` text
- `schedule` jsonb (days of week)

### `habit_logs`
- `id` uuid pk
- `habit_id` uuid
- `date` date
- `done` boolean

## Acceptance criteria
- User can create habits and mark done.