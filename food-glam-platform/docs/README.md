# MareChef.ro — Documentation

**Last Updated**: March 15, 2026

All project documentation is in **[AGENTS.md](../AGENTS.md)** — the single source of truth for architecture, features, constraints, and current status.

## Quick Links

- **Production**: https://marechef.ro
- **Repository**: food-glam-grafana (origin) + romanian
- **Supabase**: zfnxpoocddqiaiyizsri (eu-west-1)
- **Vercel**: food-glam-platform (team_C2IKNYf2cQOXkD5ESMm8DLfj)

## Database Migrations

| Migration | Description |
|-----------|-------------|
| `20260301000000_create_all_tables.sql` | Original 28-table schema |
| `20260304000000_align_schema_with_types.sql` | diet_tags, food_tags, recipe_json columns |
| `20260305000000_add_source_url.sql` | source_url on posts |
| `20260313000000_add_meal_type_to_posts.sql` | meal_type column + indexes |
| `standardize_ingredient_units` | oz/cl/dl/lb/dash → ml/g conversion (3 Postgres functions) |
