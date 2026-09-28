---
id: guides
title: Guides & Tutorials
sidebar_label: Overview
sidebar_position: 0
---

# Guides & Tutorials

This section contains practical, step-by-step guides for customizing, extending, and operating your Ever Works directory website. Each guide is self-contained but may link to related architecture pages for deeper context.

## How to Use This Section

Guides are organized by category. If you are **setting up the template for the first time**, start with the Customization and Theming guides to match the site to your brand. If you are **operating a running site**, the Admin and Client Dashboard guides will be most relevant. Developers extending the template should work through the Infrastructure and Testing guides.

## Customization & Appearance

These guides cover how to make the template your own -- from colors and layouts to navigation and footer content.

| Guide                                                     | Description                                                                                      |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [Customization](./customization.md)               | Comprehensive guide to customizing your directory site -- branding, colors, layouts, and content |
| [Theming](./theming.md)                           | The theme system: pre-built themes, custom theme creation, and runtime theme switching           |
| [Dynamic Colors](./dynamic-colors.md)             | How the dynamic color generation pipeline works and how to configure it                          |
| [Layouts & Templates](./layouts-templates.md)     | Customize page layouts, listing templates, and detail page structures                            |
| [Custom Navigation](./custom-navigation.md)       | Configure the navbar, sidebar, and breadcrumb navigation                                         |
| [Footer Customization](./footer-customization.md) | Modify footer content, links, and layout                                                         |
| [UI Components](./ui-components.md)               | Available UI components and how to use them in your pages                                        |

## Admin & Dashboard

Guides for managing content, users, and site settings through the built-in dashboards.

| Guide                                             | Description                                                                                 |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [Admin Dashboard](./admin-dashboard.md)   | Overview of admin features: content management, user roles, analytics, and settings         |
| [Admin Deep Dive](./admin-deep-dive.md)   | Advanced admin topics: bulk operations, audit logs, and moderation workflows                |
| [Admin Components](./admin-components.md) | Reusable admin UI components and how to extend the admin interface                          |
| [Client Dashboard](./client-dashboard.md) | The client-facing dashboard for item owners: submissions, analytics, and profile management |

## Data & Content

Guides related to content management, data utilities, and URL handling.

| Guide                                                   | Description                                                                |
| ------------------------------------------------------- | -------------------------------------------------------------------------- |
| [Slug Utilities](./slug-utilities.md)           | URL slug generation, validation, and conflict resolution                   |
| [Static Page Content](./static-page-content.md) | Terms, Privacy, About and Cookies copy: the data repository `pages/` files |
| [URL Utilities](./url-utilities.md)             | URL construction helpers, query parameter management, and canonical URLs   |
| [Filter Sync](./filter-sync.md)                 | How filter state is synchronized between URL parameters and the UI         |
| [Pagination Patterns](./pagination-patterns.md) | Server-side and client-side pagination implementations                     |
| [Currency Formatting](./currency-formatting.md) | Locale-aware currency display and detection                                |

## Email & Notifications

| Guide                                           | Description                                                     |
| ----------------------------------------------- | --------------------------------------------------------------- |
| [Email Templates](./email-templates.md) | Create and customize transactional email templates using Resend |

## Monetization & Sponsorship

| Guide                                                 | Description                                                  |
| ----------------------------------------------------- | ------------------------------------------------------------ |
| [Sponsorship System](./sponsorship-system.md) | Set up and manage sponsored listings and advertisement slots |
| [Survey System](./survey-system.md)           | Integrate user surveys for feedback collection               |

## Infrastructure & Operations

Guides for performance, reliability, security, and observability.

| Guide                                                             | Description                                                                          |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [Performance Optimization](./performance-optimization.md) | Caching strategies, bundle optimization, and rendering performance                   |
| [Caching Strategy](./caching-strategy.md)                 | The multi-layer caching architecture: in-memory, React Query, and HTTP cache headers |
| [Error Handling](./error-handling.md)                     | Error boundary patterns, API error responses, and user-facing error pages            |
| [Logging](./logging.md)                                   | Structured logging setup and log levels                                              |
| [Rate Limiting](./rate-limiting.md)                       | API rate limiting configuration and implementation                                   |
| [Bot Detection](./bot-detection.md)                       | reCAPTCHA integration and bot protection strategies                                  |
| [Database Health Check](./database-health-check.md)       | Monitoring database connectivity and performance                                     |
| [Accessibility](./accessibility.md)                       | Accessibility standards, testing, and common patterns used in the template           |

## Testing & Development

| Guide                                               | Description                                                                    |
| --------------------------------------------------- | ------------------------------------------------------------------------------ |
| [Testing Patterns](./testing-patterns.md)   | Playwright E2E test structure, page objects, fixtures, and running tests       |
| [Scripts Reference](./scripts-reference.md) | All CLI scripts in the `scripts/` directory: what they do and when to use them |

## Suggested Learning Paths

### Path 1: Brand Customization (Designer / Product Owner)

1. [Customization](./customization.md) -- understand what can be changed
2. [Theming](./theming.md) -- pick or create a theme
3. [Dynamic Colors](./dynamic-colors.md) -- fine-tune the color palette
4. [Footer Customization](./footer-customization.md) -- update footer links and branding
5. [Custom Navigation](./custom-navigation.md) -- configure menus

### Path 2: Site Administration (Admin / Content Manager)

1. [Admin Dashboard](./admin-dashboard.md) -- learn the admin interface
2. [Admin Deep Dive](./admin-deep-dive.md) -- advanced operations
3. [Client Dashboard](./client-dashboard.md) -- understand the client-side experience
4. [Sponsorship System](./sponsorship-system.md) -- manage sponsored content

### Path 3: Developer Extension (Full-Stack Developer)

1. [Architecture Overview](../architecture/architecture.md) -- understand the codebase structure
2. [Testing Patterns](./testing-patterns.md) -- know how to verify changes
3. [Error Handling](./error-handling.md) -- handle failures gracefully
4. [Caching Strategy](./caching-strategy.md) -- understand the caching layers
5. [Performance Optimization](./performance-optimization.md) -- keep the site fast
6. [Scripts Reference](./scripts-reference.md) -- use the CLI tools effectively

### Path 4: Infrastructure & DevOps

1. [Database Health Check](./database-health-check.md) -- monitor database health
2. [Logging](./logging.md) -- set up structured logging
3. [Rate Limiting](./rate-limiting.md) -- protect your API endpoints
4. [Bot Detection](./bot-detection.md) -- prevent abuse
5. [Performance Optimization](./performance-optimization.md) -- optimize for production load

## Cross-References

These guides are closely related to the architecture documentation. For deeper technical context, see:

- **[Architecture Overview](../architecture/architecture.md)** -- system design and layer responsibilities
- **[Theme System](../architecture/theme-system.md)** -- architecture behind theming (pairs with the Theming guide)
- **[Guards System](../architecture/guards-system.md)** -- access control architecture (pairs with Admin guides)
- **[Repository Patterns](../architecture/repository-patterns.md)** -- data access patterns (context for data guides)
- **[API Layer](../architecture/api-layer.md)** -- API route conventions (context for rate limiting and error handling)

## Getting Help

If you run into issues while following a guide:

1. **Check the [Quick Reference](../getting-started/quick-reference.md)** for common commands and patterns.
2. **Review [Getting Started](../getting-started/getting-started.md)** if you have environment or setup problems.
3. **Open an issue** on the [GitHub repository](https://github.com/ever-works/directory-web-template/issues) for bugs or feature requests.

---

Pick the guide most relevant to your current task, or follow one of the learning paths above for a structured walkthrough.
