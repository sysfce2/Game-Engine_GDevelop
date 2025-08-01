// @flow
import { t } from '@lingui/macro';
import * as React from 'react';
import SubscriptionDialog from './SubscriptionDialog';
import {
  sendSubscriptionDialogShown,
  type SubscriptionDialogDisplayReason,
  type SubscriptionPlacementId,
} from '../../Utils/Analytics/EventSender';
import { isNativeMobileApp } from '../../Utils/Platform';
import {
  hasMobileAppStoreSubscriptionPlan,
  hasValidSubscriptionPlan,
} from '../../Utils/GDevelopServices/Usage';
import AuthenticatedUserContext from '../AuthenticatedUserContext';
import useAlertDialog from '../../UI/Alert/useAlertDialog';
import useSubscriptionPlans, {
  filterAvailableSubscriptionPlansWithPrices,
} from '../../Utils/UseSubscriptionPlans';
import PromotionSubscriptionDialog from './PromotionSubscriptionDialog';
import SubscriptionPendingDialog from './SubscriptionPendingDialog';
import LoaderModal from '../../UI/LoaderModal';
import { useLazyMemo } from '../../Utils/UseLazyMemo';

export type SubscriptionType = 'individual' | 'team' | 'education';

export type SubscriptionAnalyticsMetadata = {|
  reason: SubscriptionDialogDisplayReason,
  recommendedPlanId?: string,
  placementId: SubscriptionPlacementId,
  preStep?: 'subscriptionChecker',
|};

type SubscriptionSuggestionState = {|
  /**
   * Call this when a subscription or subscription upgrade is required.
   */
  openSubscriptionDialog: ({|
    analyticsMetadata: SubscriptionAnalyticsMetadata,
    filter?: SubscriptionType,
  |}) => void,
  openSubscriptionPendingDialog: () => void,
|};

export const SubscriptionSuggestionContext = React.createContext<SubscriptionSuggestionState>(
  {
    openSubscriptionDialog: () => {},
    openSubscriptionPendingDialog: () => {},
  }
);

type SubscriptionSuggestionProviderProps = {|
  children: React.Node,
  simulateMobileApp?: true,
|};

export const SubscriptionSuggestionProvider = ({
  children,
  simulateMobileApp,
}: SubscriptionSuggestionProviderProps) => {
  const [
    analyticsMetadata,
    setAnalyticsMetadata,
  ] = React.useState<?SubscriptionAnalyticsMetadata>(null);
  const [filter, setFilter] = React.useState<
    'individual' | 'team' | 'education' | null
  >(null);
  const authenticatedUser = React.useContext(AuthenticatedUserContext);
  const { showAlert } = useAlertDialog();
  const { getSubscriptionPlansWithPricingSystems } = useSubscriptionPlans({
    includeLegacy: true,
    authenticatedUser,
  });
  const [
    subscriptionPendingDialogOpen,
    setSubscriptionPendingDialogOpen,
  ] = React.useState(false);

  const openSubscriptionPendingDialog = React.useCallback(
    () => setSubscriptionPendingDialogOpen(true),
    []
  );

  const closeSubscriptionDialog = () => setAnalyticsMetadata(null);

  const openSubscriptionDialog = React.useCallback(
    ({ analyticsMetadata: metadata, filter: subscriptionsFilter }) => {
      if (isNativeMobileApp() || simulateMobileApp) {
        if (hasValidSubscriptionPlan(authenticatedUser.subscription)) {
          if (
            !hasMobileAppStoreSubscriptionPlan(authenticatedUser.subscription)
          ) {
            showAlert({
              title: t`Subscription outside the app store`,
              message: t`The subscription of this account comes from outside the app store. Connect with your account on gdevelop.io from your web-browser to manage it.`,
            });
            return;
          }
        }

        // Would present App Store screen.
      } else {
        setFilter(subscriptionsFilter || null);
        setAnalyticsMetadata(metadata);
      }
    },
    [authenticatedUser.subscription, showAlert, simulateMobileApp]
  );

  const value = React.useMemo(
    () => ({ openSubscriptionDialog, openSubscriptionPendingDialog }),
    [openSubscriptionDialog, openSubscriptionPendingDialog]
  );

  const getAvailableSubscriptionPlansWithPrices = useLazyMemo(
    React.useCallback(
      () => {
        const subscriptionPlansWithPricingSystems = getSubscriptionPlansWithPricingSystems();

        return subscriptionPlansWithPricingSystems
          ? filterAvailableSubscriptionPlansWithPrices(
              subscriptionPlansWithPricingSystems
            )
          : null;
      },
      [getSubscriptionPlansWithPricingSystems]
    )
  );

  const getUserLegacySubscriptionPlanWithPricingSystem = useLazyMemo(
    React.useCallback(
      () => {
        const subscriptionPlansWithPricingSystems = getSubscriptionPlansWithPricingSystems();
        if (
          !authenticatedUser.subscription ||
          !authenticatedUser.subscription.planId ||
          !authenticatedUser.subscription.pricingSystemId ||
          !subscriptionPlansWithPricingSystems
        ) {
          return null;
        }
        const {
          planId: userPlanId,
          pricingSystemId: userPricingSystemId,
        } = authenticatedUser.subscription;
        const userPlanWithPricingSystems = subscriptionPlansWithPricingSystems.find(
          planWithPricingSystems => planWithPricingSystems.id === userPlanId
        );
        if (
          !userPlanWithPricingSystems ||
          !userPlanWithPricingSystems.isLegacy
        ) {
          return null;
        }
        const userPricingSystem = userPlanWithPricingSystems.pricingSystems.find(
          pricingSystem => pricingSystem.id === userPricingSystemId
        );
        if (!userPricingSystem) return null;
        return {
          ...userPlanWithPricingSystems,
          pricingSystems: [userPricingSystem],
        };
      },
      [getSubscriptionPlansWithPricingSystems, authenticatedUser.subscription]
    )
  );

  // When the analyticsMetadata is set, a dialog is shown so we can send an event.
  React.useEffect(
    () => {
      if (analyticsMetadata) {
        sendSubscriptionDialogShown(analyticsMetadata);
      }
    },
    [analyticsMetadata]
  );

  return (
    <SubscriptionSuggestionContext.Provider value={value}>
      {children}
      {subscriptionPendingDialogOpen && (
        <SubscriptionPendingDialog
          authenticatedUser={authenticatedUser}
          onClose={() => {
            setSubscriptionPendingDialogOpen(false);
            authenticatedUser.onRefreshSubscription();
          }}
          onSuccess={closeSubscriptionDialog}
        />
      )}
      {analyticsMetadata ? (
        authenticatedUser.loginState === 'loggingIn' ? (
          <LoaderModal show />
        ) : !hasValidSubscriptionPlan(authenticatedUser.subscription) &&
          analyticsMetadata.recommendedPlanId ? (
          <PromotionSubscriptionDialog
            getAvailableSubscriptionPlansWithPrices={
              getAvailableSubscriptionPlansWithPrices
            }
            onClose={closeSubscriptionDialog}
            recommendedPlanId={analyticsMetadata.recommendedPlanId}
            onOpenPendingDialog={(open: boolean) =>
              setSubscriptionPendingDialogOpen(open)
            }
          />
        ) : (
          <SubscriptionDialog
            getAvailableSubscriptionPlansWithPrices={
              getAvailableSubscriptionPlansWithPrices
            }
            getUserLegacySubscriptionPlanWithPricingSystem={
              getUserLegacySubscriptionPlanWithPricingSystem
            }
            onClose={closeSubscriptionDialog}
            filter={filter}
            onOpenPendingDialog={(open: boolean) =>
              setSubscriptionPendingDialogOpen(open)
            }
          />
        )
      ) : null}
    </SubscriptionSuggestionContext.Provider>
  );
};
