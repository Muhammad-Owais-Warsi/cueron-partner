# Job Completion Quick Start Guide

## For Engineers

### Prerequisites
Before completing a job, ensure you have:
1. ✅ Completed all mandatory checklist items
2. ✅ Captured at least one before photo
3. ✅ Captured at least one after photo
4. ✅ Added any parts used (if applicable)
5. ✅ Added engineer notes (optional)

### Step-by-Step Process

#### 1. Navigate to Job Completion
From the Job Detail screen, tap **"Complete Job"** button (only available when job status is 'onsite').

#### 2. Review Completion Summary
The screen shows:
- **Checklist Status**: Green chip = all done, Orange chip = incomplete
- **Photo Status**: Number of before and after photos
- **Parts Used**: List of parts with quantities and costs
- **Notes**: Your service observations

#### 3. Check Validation
If you see a red error card at the top:
- Read the requirements that are not met
- Go back and complete missing items
- Return to completion screen

#### 4. Capture Client Signature
- Tap on the signature canvas
- Ask client to sign with their finger
- Tap **"Save"** when done
- If signature is unclear, tap the refresh icon to retake

#### 5. Complete the Job
- Tap **"Complete Job"** button at the bottom
- Review the confirmation dialog
- Tap **"Confirm"** to finalize

#### 6. Wait for Upload
- The app uploads the signature
- Sends completion data to the server
- Shows a loading indicator

#### 7. Success!
- Green checkmark appears
- Job number and client name are shown
- Tap **"Done"** to return to jobs list
- Your availability is now set to "available"

### Troubleshooting

#### "Cannot Complete Job" Alert
**Problem**: Requirements not met
**Solution**: 
- Read the list of missing requirements
- Complete each item
- Return to completion screen

#### "Signature Required" Alert
**Problem**: No signature captured
**Solution**: 
- Capture client signature on the canvas
- Tap "Save" to confirm

#### "Completion Failed" Alert
**Problem**: Network or server error
**Solution**: 
- Check your internet connection
- Tap "Retry" to try again
- If problem persists, contact support

#### Signature Upload Fails
**Problem**: Signature won't upload
**Solution**: 
- Check internet connection
- Tap "Retry" when prompted
- Try capturing signature again if needed

### Tips for Success

1. **Complete in Order**: Follow the job workflow in sequence:
   - Accept job → Travel → Arrive onsite → Checklist → Photos → Complete

2. **Clear Signature**: Ensure client signature is clear and legible
   - Use the clear button if needed
   - Ask client to sign slowly

3. **Review Before Completing**: Double-check all information before tapping complete
   - Once completed, the job cannot be reopened

4. **Good Internet Connection**: Ensure stable connection for upload
   - Signature and data upload requires internet
   - Find a spot with good signal before completing

5. **Client Present**: Always capture signature with client present
   - Explain what they're signing
   - Show them the completion summary

### What Happens After Completion?

1. **Job Status**: Changes to "completed"
2. **Your Status**: Changes to "available" for new jobs
3. **Payment**: Automatic payment record is created
4. **History**: Job appears in your completed jobs history
5. **Rating**: Client may rate your service later

### Common Questions

**Q: Can I edit after completing?**
A: No, completion is final. Review carefully before confirming.

**Q: What if client refuses to sign?**
A: Contact your agency manager before completing the job.

**Q: Do I need internet to complete?**
A: Yes, signature upload and API call require internet connection.

**Q: What if the app crashes during completion?**
A: The job remains in its previous state. Try completing again.

**Q: Can I complete without all photos?**
A: No, at least one before and one after photo are required.

## For Developers

### Integration Points

#### 1. Navigation
```typescript
navigation.navigate('JobCompletion', { jobId: 'job-uuid' });
```

#### 2. Job Data Requirements
Ensure job object has:
```typescript
{
  id: string,
  job_number: string,
  client_name: string,
  service_checklist: ChecklistItem[],
  photos_before: string[],
  photos_after: string[],
  parts_used: Part[],
  engineer_notes?: string
}
```

#### 3. API Endpoint
```
POST /api/jobs/{jobId}/complete
```

#### 4. Storage Bucket
Ensure `job-photos` bucket exists in Supabase Storage with public access.

### Testing Checklist

- [ ] Validation prevents completion with missing requirements
- [ ] Signature capture works on both iOS and Android
- [ ] Signature upload succeeds
- [ ] API call completes successfully
- [ ] Success dialog displays
- [ ] Navigation returns to jobs list
- [ ] Engineer availability updates to 'available'
- [ ] Error handling works for network failures
- [ ] Retry functionality works
- [ ] Loading states display correctly

### Configuration

#### Environment Variables
```
EXPO_PUBLIC_API_URL=https://your-api.com
```

#### Supabase Storage
- Bucket: `job-photos`
- Path: `signatures/{jobId}_{timestamp}.png`
- Access: Public read

### Dependencies
```json
{
  "react-native-signature-canvas": "^4.7.2"
}
```

Install with:
```bash
npm install react-native-signature-canvas
# or
pnpm add react-native-signature-canvas
```
