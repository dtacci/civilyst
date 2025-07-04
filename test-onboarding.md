# Onboarding Flow Test Checklist

## Test Scenarios

### 1. New User Flow

- [ ] Sign up as a new user
- [ ] Verify redirect to `/onboarding` after authentication
- [ ] Test all 5 onboarding steps:
  - [ ] Welcome screen displays with user's name
  - [ ] Profile type selection (test all 3 options)
  - [ ] Location detection works (or manual entry)
  - [ ] Interest selection (minimum 1 required)
  - [ ] Goal selection based on profile type
- [ ] Verify redirect after completion:
  - [ ] Citizen → `/campaigns`
  - [ ] Organizer → `/campaigns/new`
  - [ ] Official → `/dashboard/analytics`

### 2. Existing User Flow

- [ ] Sign in as existing user
- [ ] Verify NO redirect to onboarding
- [ ] Normal app flow continues

### 3. Protected Routes

- [ ] Access `/dashboard` without completing onboarding
- [ ] Verify redirect to `/onboarding`
- [ ] Complete onboarding and verify access granted

### 4. Edge Cases

- [ ] Decline location permissions
- [ ] Try to skip required fields
- [ ] Navigate back/forward through steps
- [ ] Refresh page mid-onboarding
- [ ] API error handling

## Test URLs

- Development: http://localhost:3001
- Sign up: http://localhost:3001/sign-up
- Sign in: http://localhost:3001/sign-in
- Onboarding: http://localhost:3001/onboarding
- Dashboard: http://localhost:3001/dashboard

## Expected Behavior

1. New users automatically redirected to onboarding
2. Progress bar shows completion status
3. Form validation prevents skipping required fields
4. Smooth animations between steps
5. Mobile-responsive design
6. Personalized redirects based on profile type
