# Testing Guidelines for Experience Miner - MVP Phase

This guide outlines testing practices for the Experience Miner frontend application during its early MVP development phase.

## Current Testing Approach

During the MVP development phase, we're taking a pragmatic approach to testing that balances quality with development speed:

1. **Manual Testing**: Primary method for validating new features and changes
2. **E2E Testing with Playwright**: For automating critical user flow validation

## Key User Flows to Test

Based on our application structure, these are the critical flows to focus testing on:

1. **Authentication Flow**
   - Login with OTP
   - Session persistence

2. **Topic Selection Flow**
   - Browse topics
   - Select topic for interview

3. **Interview Session Flow**
   - Recording audio answers
   - Transcription functionality
   - Text input for answers
   - Navigation between questions
   - Saving answers

4. **Review Flow**
   - View interview answers
   - Navigate between answers
   - Edit answers

5. **Credits System**
   - Credits display
   - Credits consumption for features

## Manual Testing Process

For each feature or significant change, create a checklist of scenarios to test manually:

```
Feature: Interview Session
[ ] User can start audio recording
[ ] User can pause and resume recording
[ ] Transcription works correctly
[ ] User can switch to text input mode
[ ] User can navigate between questions
[ ] Answers are saved when navigating
[ ] Error states are handled appropriately
[ ] Credits are deducted properly
```

## Playwright E2E Testing

For our most critical flows, we use Playwright to create automated tests.

### Setting Up Playwright

```bash
# Install Playwright
npm install -D @playwright/test

# Add to package.json scripts
# "test:e2e": "playwright test"
```

### Example Playwright Test for Authentication Flow

```typescript
// tests/auth.spec.ts
import { test, expect } from '@playwright/test';

test('user can login with OTP', async ({ page }) => {
  // Navigate to login page
  await page.goto('/');
  
  // Enter email
  await page.fill('[data-testid="email-input"]', 'test@example.com');
  await page.click('[data-testid="send-otp-button"]');
  
  // Verify OTP screen appears
  await expect(page.locator('[data-testid="otp-input"]')).toBeVisible();

  // Note: Supabase Auth doesn't provide a fixed OTP for testing
  // approach: https://mailosaur.com/blog/testing-otp-playwright?utm_source=chatgpt.com
  await page.fill('[data-testid="otp-input"]', '123456');
  await page.click('[data-testid="verify-otp-button"]');
  
  // Verify successful login - should see topics screen
  await expect(page.locator('[data-testid="topic-selection"]')).toBeVisible();
});
```

### Example Playwright Test for Interview Flow

```typescript
// tests/interview.spec.ts
import { test, expect } from '@playwright/test';

// Setup authentication for tests that require login
async function login(page) {
  // Implementation of login flow for tests
  // ...
}

test('user can complete an interview session', async ({ page }) => {
  // Login first
  await login(page);
  
  // Navigate to topics
  await page.goto('/guide/topics');
  
  // Select a topic
  await page.click('[data-testid="topic-item"]:first-child');
  
  // Verify interview screen appears
  await expect(page.locator('[data-testid="interview-container"]')).toBeVisible();
  
  // Test text input mode (since we can't easily test audio in automation)
  await page.click('[data-testid="text-mode-button"]');
  await page.fill('[data-testid="answer-text"]', 'This is my test answer');
  
  // Navigate to next question
  await page.click('[data-testid="next-button"]');
  
  // Verify navigation worked
  await expect(page.locator('[data-testid="question-number"]')).toContainText('2');
  
  // Complete the interview
  await page.fill('[data-testid="answer-text"]', 'Answer to the final question');
  await page.click('[data-testid="finish-button"]');
  
  // Verify redirection to review screen
  await expect(page.url()).toContain('/review');
});
```

### Organizing Playwright Tests

Structure Playwright tests by feature or user flow:

```
tests/
  auth/
    login.spec.ts
  guide/
    topic-selection.spec.ts
    interview-session.spec.ts
    review.spec.ts
  credits/
    credit-display.spec.ts
```

## Adding Testing Attributes

To make both manual and automated testing easier, add `data-testid` attributes to important UI elements:

```tsx
// Example for GuideScreen.tsx
<div data-testid="topic-selection">
  <ChooseTopicContainer onTopicSelect={handleNavigateToStep} />
</div>

// Example for InterviewUI
<button 
  data-testid="next-button" 
  onClick={onNext} 
  disabled={!hasAnswer || saving}
>
  Next
</button>
```

## Mocking Considerations

For testing, we need to consider mocking these services:

1. **API Service**: Mock responses for topics, interviews, etc.
2. **Transcription Service**: Mock audio transcription
3. **Supabase Authentication**: Mock login flows

Example MSW setup for API mocking in tests:

```typescript
// tests/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/topics', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        responseObject: {
          topics: [
            { id: 1, title: 'Topic 1', description: 'Description 1' },
            { id: 2, title: 'Topic 2', description: 'Description 2' }
          ]
        }
      })
    );
  }),
  
  rest.get('/api/interviews/:id', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        responseObject: {
          interview: {
            id: 1,
            title: 'Test Interview',
            description: 'Test Description'
          },
          answers: [
            { 
              question_id: 1, 
              question: 'Test Question 1?', 
              question_number: 1, 
              answer: '' 
            },
            { 
              question_id: 2, 
              question: 'Test Question 2?', 
              question_number: 2, 
              answer: '' 
            }
          ]
        }
      })
    );
  })
];
```

## Testing Strategy Evolution

As the application matures:

1. **Short term (MVP)**:
   - Focus on manual testing with documented test cases
   - Implement Playwright tests for authentication and interview flow
   - Add data-testid attributes to key components

2. **Medium term (Stabilization)**:
   - Add unit tests for stable hooks like useInterview, useAudioRecorder
   - Implement mocks for API services and external dependencies
   - Set up CI pipeline for running tests

3. **Long term (Scaling)**:
   - Component testing for UI elements
   - Comprehensive testing for all user flows
   - Performance and accessibility testing

## Guiding Principles

1. **Focus on user flows**: Prioritize testing the end-to-end user journeys
2. **Test the risky parts**: Focus on audio recording, transcription, and saving answers
3. **Keep tests maintainable**: As the UI evolves rapidly, focus on testing behavior over appearance
4. **Document manual tests**: Keep a record of test cases for important features

## Conclusion

During the MVP phase, our testing approach prioritizes speed and flexibility while ensuring core functionality works correctly. This approach will evolve as the application matures and stabilizes.
