# Unsplash Production Access Application Draft

> Use this text when submitting at https://unsplash.com/oauth/applications/890338
> Fill in screenshots of live recipe pages showing attribution.

## Application Description

MareChef.ro is a Romanian food recipe platform featuring 3,300+ recipes from 168 countries. We use Unsplash photos as hero images for recipes, providing beautiful food photography alongside cooking instructions, ingredients, and nutritional information.

## How images are used

Each recipe page displays a single hero image at the top. The image supports the recipe content — users come to our platform to discover and cook recipes, not to browse or download photos.

## Compliance Details

### Hotlinking
All Unsplash images are served directly from `images.unsplash.com`. We do NOT download, cache, or self-host any Unsplash photos. Example URL format stored in our database:
`https://images.unsplash.com/photo-XXXXX?auto=format&fit=crop&w=800&q=80`

### Attribution
Every recipe page with an Unsplash image displays attribution in the format:
**"Foto de [Photographer Name] pe Unsplash"** (Romanian localization of "Photo by [Name] on Unsplash")

Both the photographer's name and "Unsplash" are clickable links:
- Photographer name links to their Unsplash profile (`https://unsplash.com/@username`)
- "Unsplash" links to the photo page (`https://unsplash.com/photos/photo-id`)

### Download Tracking
Our application triggers the `download_location` endpoint for every Unsplash photo when it is selected for use. This is implemented in our image search module (`lib/image-search.js`) via the `triggerDownload()` method, which calls the download endpoint with proper authentication headers.

### Non-Competing Service
MareChef.ro is a recipe/cooking platform. Photos are supporting content for recipes — we do not offer image search, image discovery, image downloads, or any functionality that competes with Unsplash's core service.

## Technical Implementation

- **Framework**: Next.js (React)
- **Image display**: Standard `<img>` tags with `src` pointing to `images.unsplash.com`
- **Attribution storage**: `image_attribution` JSONB column in PostgreSQL storing `{source, photographer, photographerUrl, sourceUrl, photoId}`
- **Attribution rendering**: Conditional display on recipe detail pages — shows attribution only for Unsplash-sourced images
- **Download tracking**: `triggerDownload()` called during image selection/assignment process

## Estimated Usage

- Current: ~100 recipes use Unsplash images (minority of 3,300+ total)
- Primary image sources: Pexels, Pixabay (majority)
- Unsplash serves as a fallback provider in our multi-provider search
- Estimated requests: 20-50/hour during normal operation, spikes during batch image updates

## Screenshots to Include

1. Recipe page showing hero image with attribution visible
2. Attribution text showing "Foto de [Name] pe Unsplash" with links
3. Multiple recipe pages showing consistent attribution display
