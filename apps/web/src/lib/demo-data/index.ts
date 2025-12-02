/**
 * Demo Data System - Public API
 * 
 * This module provides the complete demo data system for the dashboard application.
 * Demo users see realistic generated data instead of real database data, enabling
 * demonstrations, testing, and onboarding without requiring real data.
 * 
 * @module demo-data
 * 
 * Key Features:
 * - Deterministic data generation (same user always sees same data)
 * - Realistic value ranges matching production patterns
 * - Complete data structures matching database schemas
 * - Write operation prevention for demo users
 * - Easy user management via CLI or programmatic API
 * 
 * @example Basic Usage in API Routes
 * ```typescript
 * import { isDemoUser, generateDashboardData } from '@/lib/demo-data';
 * import { getUserSession } from '@/lib/auth/server';
 * 
 * export async function GET(request: NextRequest) {
 *   const session = await getUserSession();
 *   
 *   if (isDemoUser(session)) {
 *     // Serve demo data
 *     return NextResponse.json(generateDashboardData(session.user_id));
 *   }
 *   
 *   // Query real database
 *   const { data } = await supabase.from('analytics').select('*');
 *   return NextResponse.json(data);
 * }
 * ```
 * 
 * @example User Management
 * ```typescript
 * import { setDemoUserFlag, isDemoUserById } from '@/lib/demo-data';
 * 
 * // Mark user as demo user
 * await setDemoUserFlag(supabaseUrl, serviceKey, userId);
 * 
 * // Check demo status
 * const { isDemo } = await isDemoUserById(supabaseUrl, serviceKey, userId);
 * ```
 * 
 * @see {@link ./README.md} for complete documentation
 * @see {@link ../../../../../DEMO_USER_MANAGEMENT.md} for user guide
 * @see {@link ../../../../../.kiro/specs/dashboard-demo-data/design.md} for technical design
 */

// Seeded random number generator for deterministic data generation
export { SeededRandom } from './seeded-random';

// Data generation functions
export {
  generateEarnings,
  generateDashboardData,
  generateMonthlyMetrics,
  generateJobs,
  generateEngineers,
} from './generator';

// Demo user detection and routing
export { isDemoUser, getDemoOrRealData, preventDemoUserWrites } from './middleware';

// User management functions
export {
  setDemoUserFlag,
  unsetDemoUserFlag,
  queryDemoUsers,
  isDemoUserById,
} from './user-management';
