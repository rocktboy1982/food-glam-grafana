# Module: Activity (Optional) + Energy Balance

## Purpose
Optionally adjust calorie targets based on activity.

## Scope
- Manual activity entries first (free)
- Optional integrations later (Apple Health/Google Fit are complex and platform-restricted)

## DB
### `activity_logs`
- `id` uuid pk
- `owner_id` uuid
- `date` date
- `activity_type` text
- `minutes` int
- `estimated_calories_burned` int nullable

## Acceptance criteria
- User can record activity and view totals.