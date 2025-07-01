/**
 * Real-time Components and Utilities
 *
 * This module provides real-time functionality for the Civilyst platform,
 * including live updates for campaigns, comments, votes, and connection status.
 */

// Components
export { ConnectionStatus } from './ConnectionStatus';
export { RealtimeNotifications } from './RealtimeNotifications';

// Real-time library
export * from '~/lib/supabase-realtime';

// Hooks
export * from '~/hooks/useRealtimeSubscriptions';

/**
 * Quick usage guide:
 *
 * @example Basic connection status:
 * ```tsx
 * import { ConnectionStatus } from '~/components/realtime';
 *
 * <ConnectionStatus variant="compact" showMetrics />
 * ```
 *
 * @example Campaign real-time updates:
 * ```tsx
 * import { useCampaignRealtime } from '~/components/realtime';
 *
 * function CampaignPage({ campaignId }) {
 *   const realtime = useCampaignRealtime(campaignId);
 *
 *   useEffect(() => {
 *     if (realtime.newComment) {
 *       // Handle new comment
 *     }
 *   }, [realtime.newComment]);
 *
 *   return (
 *     <div>
 *       <ConnectionStatus variant="tooltip" />
 *       Comments: {realtime.commentCount}
 *       Votes: {realtime.totalVotes}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example Real-time notifications:
 * ```tsx
 * import { RealtimeNotifications } from '~/components/realtime';
 *
 * <RealtimeNotifications
 *   variant="badge"
 *   onNotificationClick={(notification) => {
 *     // Handle notification click
 *   }}
 * />
 * ```
 *
 * @example Manual subscription management:
 * ```tsx
 * import { getSubscriptionManager } from '~/components/realtime';
 *
 * const manager = getSubscriptionManager();
 * if (manager) {
 *   const subscriptionKey = manager.subscribeToCampaignUpdates(
 *     campaignId,
 *     (payload) => {
 *       console.log('Campaign updated:', payload);
 *     }
 *   );
 *
 *   // Later...
 *   manager.unsubscribe(subscriptionKey);
 * }
 * ```
 */
