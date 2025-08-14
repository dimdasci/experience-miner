# Experience Miner Frontend Style Guide

This style guide outlines the conventions, patterns, and best practices for the Experience Miner frontend codebase. It aims to ensure consistency across the project and prevent technical debt.

## Guide Contents

1. [Directory Structure](./directory-structure.md) - How to organize files and folders
2. [Component Architecture](./component-architecture.md) - Patterns for building components
3. [Naming Conventions](./naming-conventions.md) - Rules for naming files, components, and variables
4. [Import Standards](./import-standards.md) - How to organize imports
5. [State Management](./state-management.md) - Guidelines for managing application state
6. [TypeScript Usage](./typescript-usage.md) - TypeScript best practices
7. [Testing Guidelines](./testing-guidelines.md) - Testing practices and strategies (TODO: needs a dedicated sprint)

## Core Principles

1. **Feature-First Organization** - Code is primarily organized by business domain feature
2. **Clear Separation of Concerns** - UI, business logic, and data access are kept separate
3. **Reusability** - Shared code is placed in the shared directory
4. **Discoverability** - Consistent patterns make code easy to find
5. **Maintainability** - Code is structured to be easy to update and refactor
6. **Type Safety** - Strict TypeScript configuration prevents runtime errors
7. **Tool Consistency** - Use Biome for linting/formatting, npm for package management

## Quick Reference

```
features/                # All business domain features
  auth/                  # Authentication feature
    elements/            # Small UI components specific to auth
    containers/          # Components with business logic
    views/               # Complete UI assemblies
    hooks/               # Feature-specific hooks
    contexts/            # Feature-specific context providers
  
shared/                  # Truly shared, cross-feature code
  ui/                    # Shared UI components
  hooks/                 # Shared hooks
  types/                 # Shared type definitions
  services/              # Shared services
```

## Contributing

When contributing to the codebase, please refer to these guidelines. If you believe a guideline needs to be updated or have questions, please discuss with the team.
