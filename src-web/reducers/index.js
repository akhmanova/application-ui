/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2017, 2019. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/
/*
 *
 * Things you should never do inside a reducer:
 *
 * - Mutate its arguments
 * - Perform side effects like API calls and routing transitions
 * - Call non-pure functions, e.g. Date.now() or Math.random()
 *
 * Reducers must be deterministic pure functions.  Given the same arguments, it should calculate the next state and return it.
 * No surprises. No side effects. No API calls. No mutations. Just a calculation.
 *
 * Selectors should sit along side reducers.
 */

import { createResourceReducer, resourceReducerFunction } from './common';
import { RESOURCE_TYPES } from '../../lib/shared/constants';
import lodash from 'lodash';

export { user, loggedIn } from './user';
export { secondaryHeader } from './common';

export { uiconfig } from './uiconfig';
export { role } from './role';

export { modal } from './modal';

export { logs } from './logs';

export { AppDeployments } from './reducerAppDeployments';

// the exported function name must match the resourceType value
export const HCMApplicationList = createResourceReducer(
  resourceReducerFunction,
  predicate.bind(null, RESOURCE_TYPES.HCM_APPLICATIONS),
);
export const HCMClusterList = createResourceReducer(
  resourceReducerFunction,
  predicate.bind(null, RESOURCE_TYPES.HCM_CLUSTERS),
);
export const HCMPodList = createResourceReducer(
  resourceReducerFunction,
  predicate.bind(null, RESOURCE_TYPES.HCM_PODS),
);
export const HCMChannelList = createResourceReducer(
  resourceReducerFunction,
  predicate.bind(null, RESOURCE_TYPES.HCM_CHANNELS),
);

export { topology } from './topology';
export { resourceFilters } from './filter';

function predicate(resourceType, action) {
  if (lodash.isEqual(resourceType, action.resourceType)) return true;
  return lodash.find(lodash.values(resourceType), (type) => {
    if (typeof type === 'string') {
      return type.indexOf(action.resourceType) > -1;
    }
    return false;
  });
}
