# Service Checklist Screen

## Overview

The Service Checklist Screen provides an interactive interface for field engineers to complete service checklists, track parts used, and add service notes during job execution.

## Requirements Implemented

- **7.1**: Display all required verification items
- **7.2**: Store completion status in job record
- **7.5**: Enable job completion when all items complete
- **8.1**: Validate all mandatory items completed before allowing job completion

## Features

### 1. Checklist Display and Interaction
- Displays all checklist items with checkboxes
- Shows completion progress with visual progress bar
- Real-time percentage calculation
- Strike-through styling for completed items
- Individual item notes display

### 2. Parts Used Tracking
- Add parts with name, quantity, and cost
- Display list of all parts used
- Remove parts with confirmation
- Input validation for quantity and cost

### 3. Engineer Notes
- Multi-line text input for service observations
- Persistent notes storage
- Keyboard-aware layout

### 4. Completion Validation
- Progress indicator showing X of Y items completed
- Visual badge when all items are completed
- Warning message when items are incomplete
- Prevents job completion until all mandatory items are checked

### 5. Data Persistence
- Auto-save detection with "Save Checklist" button
- API integration with PATCH /api/jobs/{id}/checklist
- Optimistic UI updates
- Error handling with user feedback

### 6. Offline Support (Basic)
- Local state management for checklist items
- Unsaved changes tracking
- Manual save trigger

## API Integration

### GET /api/jobs/{id}/checklist
Fetches the current checklist state with completion statistics.

**Response:**
```typescript
{
  job_id: string;
  status: string;
  checklist: ChecklistItem[];
  stats: {
    total_items: number;
    completed_items: number;
    pending_items: number;
    completion_percentage: number;
    all_completed: boolean;
  };
  completion_enabled: boolean;
  can_complete_job: boolean;
}
```

### PATCH /api/jobs/{id}/checklist
Updates the checklist items with completion status.

**Request:**
```typescript
{
  checklist: ChecklistItem[];
}
```

## Data Structures

### ChecklistItem
```typescript
interface ChecklistItem {
  item: string;
  completed: boolean;
  notes?: string;
}
```

### PartUsed
```typescript
interface PartUsed {
  name: string;
  quantity: number;
  cost: number;
}
```

## User Flow

1. Engineer navigates to job detail screen
2. When job status is "onsite", "View Checklist" button appears
3. Engineer taps button to open Service Checklist Screen
4. Engineer checks off completed items
5. Progress bar updates in real-time
6. Engineer adds parts used (optional)
7. Engineer adds service notes (optional)
8. Engineer taps "Save Checklist" to persist changes
9. When all items are completed, success message appears
10. Engineer can proceed to complete the job

## Validation Rules

1. **Checklist Completion**: All items must be checked to enable job completion
2. **Part Name**: Required, non-empty string
3. **Part Quantity**: Required, positive integer
4. **Part Cost**: Required, non-negative number
5. **Job Status**: Checklist can only be updated when job status is "onsite"

## Error Handling

- Network errors display user-friendly alerts
- Invalid input shows validation messages
- Failed saves allow retry
- Loading states prevent duplicate submissions
- Graceful fallback for missing data

## Future Enhancements

1. **Offline-First Architecture**
   - Store checklist in AsyncStorage
   - Sync when connection restored
   - Conflict resolution

2. **Photo Integration**
   - Link photos to specific checklist items
   - Before/after photo requirements per item

3. **Item Notes**
   - Add notes to individual checklist items
   - Voice-to-text for notes

4. **Templates**
   - Pre-defined checklist templates by equipment type
   - Custom checklist creation

5. **Time Tracking**
   - Track time spent on each checklist item
   - Total service duration calculation

## Testing Considerations

### Unit Tests
- Checklist item toggling
- Parts validation
- Progress calculation
- State management

### Integration Tests
- API communication
- Data persistence
- Error handling
- Navigation flow

### Property-Based Tests
- Checklist completion validation (Property 30, 31, 34, 35)
- Progress calculation accuracy
- Data integrity

## Accessibility

- Checkbox controls are touch-friendly (48x48 minimum)
- Text inputs have proper labels
- Error messages are clear and actionable
- Color is not the only indicator of state
- Keyboard navigation support

## Performance

- Efficient re-renders with React hooks
- Optimistic UI updates
- Debounced auto-save (future enhancement)
- Lazy loading for large checklists (future enhancement)

## Dependencies

- `react-native-paper`: UI components
- `@tanstack/react-query`: Data fetching and caching
- `@cueron/types`: TypeScript type definitions
- `supabase`: Authentication

## Related Files

- `apps/mobile/src/screens/jobs/JobDetailScreen.tsx` - Parent screen
- `apps/mobile/src/navigation/JobsStackNavigator.tsx` - Navigation setup
- `apps/web/src/app/api/jobs/[id]/checklist/route.ts` - API endpoint
- `packages/types/src/job.ts` - Type definitions
