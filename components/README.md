# Components Structure

This folder is organized by feature to make component ownership and discovery easier.

- `layout/` — app shell and global layout UI (`DashboardShell`, `BottomNav`, theme/header wrappers)
- `shared/` — reusable primitives shared across pages (`GlassCard`, `SectionHeader`)
- `dashboard/` — home/dashboard widgets and summary cards
- `routine/` — routine timeline, editors, and reminder-related components
- `recipes/` — recipe list/detail/editor components
- `workouts/` — gym/workout detail/editor and body-map components
- `progress/` — progress tracking UI
- `settings/` — settings page client components
- `profile/` — profile-specific UI (`AvatarUpload`)
- `health/` — health-plan editing components

## Compatibility

For backward compatibility, top-level files in `components/` currently re-export from these feature folders, so existing imports like `@/components/Foo` keep working.
