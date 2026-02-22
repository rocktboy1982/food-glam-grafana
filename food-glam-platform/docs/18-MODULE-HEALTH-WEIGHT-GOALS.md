# Module: Health / Weight / Goals (Post-MVP but planned)

## Purpose
Give users full control over body weight goals, progress tracking, and plan adherence while keeping privacy strong.

## Features
- Goal mode: lose / gain / maintain
- Target weight + target date
- Weight log (timestamped)
- Body measurements (waist/hips/etc.)
- Progress photos (optional, private)

## Routes
- `/me/health`
- `/me/health/weight`
- `/me/health/measurements`

## DB
### `user_goals`
- `owner_id` uuid pk
- `goal_mode` text enum: `lose|gain|maintain`
- `target_weight_kg` numeric
- `target_date` date
- `created_at`, `updated_at`

### `weight_logs`
- `id` uuid pk
- `owner_id` uuid
- `date` date
- `weight_kg` numeric
- `notes` text nullable
- unique(owner_id, date)

### `body_measurements`
- `id` uuid pk
- `owner_id` uuid
- `date` date
- `waist_cm` numeric nullable
- `hips_cm` numeric nullable
- `chest_cm` numeric nullable
- `body_fat_percent` numeric nullable

### `progress_photos`
- `id` uuid pk
- `owner_id` uuid
- `taken_at` timestamp
- `image_url` text
- `visibility` text enum: `private`

## RLS
- All private to owner.

## Acceptance criteria
- User can set goal and log weight.
- Charts show progress over time.