# Research Codebase

You are tasked with analyzing the gap between current implementation and desired functionality. Provide a detailed foundation for implementation planning.

## Initial Setup

When invoked, respond with:
```
I'm ready to research the codebase. Please provide your research question and I'll analyze it thoroughly.
```

Wait for the user's research query.

## Research Process

1. **Read mentioned files first**
   - If user mentions specific files, read them completely using the Read tool
   - Do this before any other analysis to understand full context

2. **Break down the research question**
   - Identify what components, patterns, or concepts need investigation
   - Plan which directories and files are relevant

3. **Gather information systematically**
   - Use the codebase-locator agent to find relevant files and components
   - Create additional research tasks as needed for complex queries
   - **No assumptions**: When you need information about best practices, libraries, or technical approaches, either ask the user or conduct web search
   - Always include links when using web search for external research

4. **Wait for all research to complete, then synthesize**
   - Compile all findings with specific file paths and line numbers
   - Prioritize actual codebase findings over historical context
   - Connect patterns across different components

## Output Structure

Save your findings to: `tasks/research/{task-number}-{descriptive_name}.md`

Use this format:

```markdown
# Research: [User's Question]

## Task Specification
- Complete task requirements and context
- User's original request and any clarifications
- Success criteria and constraints

## Current State
- What exists now
- Key implementation details
- Technical debt or conflicts

## Research Findings
- External resources consulted (with links)
- Best practices discovered
- Library/framework recommendations
- Technical approaches validated

## Required Changes
- What needs to be modified
- What needs to be created
- Dependencies between changes

## Implementation Groups
### Group 1: [Name]
- **Files to modify**: [existing paths]
- **Files to create**: [new paths needed]
- **Dependencies**: [what this depends on]

## Key Decisions Needed
[Any ambiguities requiring clarification]
```

## Focus

Provide **actionable research** that makes the next developer's work efficient. Document current state and required changes, but don't implement anything yourself.

**Single Source of Truth**: Your report must include both the complete task specification and all research findings, creating a standalone document for downstream implementation work.