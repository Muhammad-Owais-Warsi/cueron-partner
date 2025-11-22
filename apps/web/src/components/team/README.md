# Team Management Components

This directory contains all components related to team (engineer) management functionality.

## Components

### EngineersListView
Displays engineers in a table format with filtering, sorting, and pagination.

**Features:**
- Filter by availability status
- Pagination support
- Availability toggle
- Performance metrics display
- Click to view engineer profile

**Props:**
- `agencyId?: string` - Optional agency ID (defaults to current user's agency)

### TeamMapView
Displays real-time locations of active engineers on a map.

**Features:**
- Real-time location tracking
- Engineer status indicators
- Selected engineer details
- Auto-refresh every 30 seconds

**Props:**
- `agencyId?: string` - Optional agency ID (defaults to current user's agency)

### AddEngineerDialog
Multi-step form for adding a new engineer.

**Features:**
- 3-step wizard (Basic Info, Skills & Certifications, Review)
- Form validation
- Certification management
- Specialization selection

**Props:**
- `isOpen: boolean` - Dialog visibility state
- `onClose: () => void` - Close handler
- `onSuccess: () => void` - Success callback
- `agencyId?: string` - Optional agency ID

### BulkUploadDialog
Handles CSV file upload for bulk engineer creation.

**Features:**
- CSV template download
- File validation
- Upload progress
- Error reporting with row details
- Success/failure summary

**Props:**
- `isOpen: boolean` - Dialog visibility state
- `onClose: () => void` - Close handler
- `onSuccess: () => void` - Success callback

## API Endpoints Used

- `GET /api/agencies/{id}/engineers` - List engineers
- `POST /api/agencies/{id}/engineers` - Create engineer
- `GET /api/engineers/{id}` - Get engineer details
- `PATCH /api/engineers/{id}` - Update engineer
- `POST /api/engineers/bulk-upload` - Bulk upload engineers
- `GET /api/engineers/{id}/performance` - Get performance metrics

## Requirements Covered

- **2.1**: Engineer-agency linkage
- **2.2**: Phone number uniqueness validation
- **2.3**: Certification data storage
- **2.4**: Default availability status
- **2.5**: Bulk engineer upload
- **9.3**: Team map view with real-time locations

## Usage Example

```tsx
import { EngineersListView, AddEngineerDialog } from '@/components/team';

function TeamPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsAddDialogOpen(true)}>
        Add Engineer
      </button>
      
      <EngineersListView />
      
      <AddEngineerDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSuccess={() => {
          setIsAddDialogOpen(false);
          // Refresh list
        }}
      />
    </div>
  );
}
```

## Future Enhancements

- Google Maps integration for TeamMapView
- Real-time updates using Supabase Realtime
- Advanced filtering (by skill level, specialization)
- Export engineers list to CSV
- Engineer performance comparison charts
