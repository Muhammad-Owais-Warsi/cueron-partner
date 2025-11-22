# @cueron/utils

Utility functions and validation schemas for the Cueron Partner Platform.

## Installation

This package is part of the monorepo workspace. To install dependencies:

```bash
# From project root
pnpm install
```

## Contents

### Validation Functions (`validation.ts`)

Basic validation utilities for common data types:

- `validatePhone(phone: string)` - Validates Indian phone numbers (10 digits starting with 6-9)
- `validateEmail(email: string)` - Validates email addresses
- `validateGSTN(gstn: string)` - Validates GSTN format
- `validatePincode(pincode: string)` - Validates Indian pincodes
- `validateIFSC(ifsc: string)` - Validates IFSC codes
- `validatePAN(pan: string)` - Validates PAN numbers

### Zod Schemas (`schemas.ts`)

Runtime validation schemas using Zod for all data models:

#### Agency Schemas
- `AgencySchema` - Complete agency validation
- `CreateAgencyInputSchema` - Agency registration validation
- `UpdateAgencyInputSchema` - Agency update validation

#### Engineer Schemas
- `EngineerSchema` - Complete engineer validation
- `CreateEngineerInputSchema` - Engineer creation validation
- `UpdateEngineerInputSchema` - Engineer update validation
- `CertificationSchema` - Certification validation

#### Job Schemas
- `JobSchema` - Complete job validation
- `CreateJobInputSchema` - Job creation validation
- `UpdateJobInputSchema` - Job update validation
- `JobFiltersSchema` - Job filtering validation
- `ChecklistItemSchema` - Service checklist validation
- `PartUsedSchema` - Parts used validation

#### Payment Schemas
- `PaymentSchema` - Complete payment validation
- `CreatePaymentInputSchema` - Payment creation validation
- `UpdatePaymentInputSchema` - Payment update validation

#### Common Schemas
- `AddressSchema` - Address validation
- `LocationSchema` - Lat/lng validation
- `PostGISPointSchema` - PostGIS point validation

#### Helper Functions
- `validateData<T>(schema, data)` - Safe validation returning result object
- `validateDataOrThrow<T>(schema, data)` - Validation that throws on error

### Test Factories (`test-factories.ts`)

Factory functions for generating test data:

#### Single Entity Factories
- `createMockAgency(overrides?)` - Generate mock agency
- `createMockEngineer(overrides?)` - Generate mock engineer
- `createMockJob(overrides?)` - Generate mock job
- `createMockPayment(overrides?)` - Generate mock payment
- `createMockCertification(overrides?)` - Generate mock certification

#### Input Factories
- `createMockCreateAgencyInput(overrides?)` - Generate agency creation input
- `createMockCreateEngineerInput(overrides?)` - Generate engineer creation input
- `createMockCreateJobInput(overrides?)` - Generate job creation input
- `createMockCreatePaymentInput(overrides?)` - Generate payment creation input

#### Batch Factories
- `createMockAgencies(count, overrides?)` - Generate multiple agencies
- `createMockEngineers(count, overrides?)` - Generate multiple engineers
- `createMockJobs(count, overrides?)` - Generate multiple jobs
- `createMockPayments(count, overrides?)` - Generate multiple payments

#### Scenario Factories
- `createMockAgencyWithTeam(engineerCount, jobCount)` - Complete agency with team
- `createMockCompletedJob(overrides?)` - Job with full lifecycle
- `createMockEngineerWithHistory(completed, cancelled)` - Engineer with performance data

### Formatting (`formatting.ts`)

Data formatting utilities (see file for details).

### Constants (`constants.ts`)

Application constants (see file for details).

## Usage Examples

### Validating Input Data

```typescript
import { CreateAgencyInputSchema, validateData } from '@cueron/utils';

const result = validateData(CreateAgencyInputSchema, userInput);

if (result.success) {
  // Data is valid and typed
  const agency = await createAgency(result.data);
} else {
  // Handle validation errors
  console.error(result.errors);
}
```

### Using Test Factories

```typescript
import { createMockAgency, createMockEngineers } from '@cueron/utils';

describe('Agency Management', () => {
  it('should list agency engineers', () => {
    const agency = createMockAgency();
    const engineers = createMockEngineers(5, { agency_id: agency.id });
    
    // Test your code with mock data
    expect(engineers).toHaveLength(5);
    expect(engineers[0].agency_id).toBe(agency.id);
  });
});
```

### Validating API Requests

```typescript
import { CreateJobInputSchema } from '@cueron/utils';

export async function POST(request: Request) {
  const body = await request.json();
  
  // Validate and parse in one step
  const jobData = CreateJobInputSchema.parse(body);
  
  // jobData is now typed and validated
  const job = await createJob(jobData);
  
  return Response.json(job);
}
```

## Dependencies

- `zod` - Runtime validation library
- `@cueron/types` - TypeScript type definitions

## Development

### Type Checking

```bash
pnpm type-check
```

### Linting

```bash
pnpm lint
```

### Testing

```bash
pnpm test
```

## Notes

- All phone number validations expect Indian format (10 digits starting with 6-9)
- GSTN validation follows the official format
- Zod schemas provide both runtime validation and TypeScript type inference
- Test factories generate realistic data with proper relationships
- All schemas support partial updates via optional fields
