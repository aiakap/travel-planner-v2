import { headers } from 'next/headers';
import { auth } from '@/auth';
import { withTracking } from './performance-tracker';

/**
 * Higher-order function to wrap page components with performance tracking
 * 
 * Usage:
 * export default withPerformanceTracking(async function MyPage() {
 *   // Your page component code
 * });
 */
export function withPerformanceTracking<P = any>(
  PageComponent: (props: P) => Promise<React.ReactElement>
): (props: P) => Promise<React.ReactElement> {
  return async function TrackedPage(props: P): Promise<React.ReactElement> {
    // Get tracking metadata from headers
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') || '';
    const requestId = headersList.get('x-request-id') || undefined;
    const userAgent = headersList.get('x-user-agent') || undefined;
    
    // Get user ID if authenticated
    const session = await auth();
    const userId = session?.user?.id;

    // Wrap the page component with tracking
    return await withTracking(
      {
        pathname,
        userId,
        sessionId: requestId,
        userAgent,
      },
      async () => {
        return await PageComponent(props);
      }
    );
  };
}
