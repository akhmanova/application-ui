/*******************************************************************************
 * Licensed Materials - Property of IBM
 * 5737-E67
 * (c) Copyright IBM Corporation 2019. All Rights Reserved.
 *
 * US Government Users Restricted Rights - Use, duplication or disclosure
 * restricted by GSA ADP Schedule Contract with IBM Corp.
 *******************************************************************************/
import R from 'ramda'

export const getRelatedItems = (related, kind) => {
  let result = []
  let filtered = []
  if (related instanceof Array && related.length > 0) {
    if (kind === 'deployment') {
      filtered = related.filter(
        elem =>
          ![
            'deployable',
            'channel',
            'cluster',
            'subscription',
            'placementbinding',
            'placementrule',
            'placementpolicy',
            'applicationrelationship'
          ].includes(elem.kind)
      )
    } else {
      filtered = related.filter(elem => elem.kind === kind)
    }
    filtered.map(elem => {
      if (elem.items instanceof Array) {
        if (kind === 'subscription') {
          //filter out remote cluster subscriptions
          // identified by the fact that the _hostingSubscription is defined
          const isHubSubscr = item => !item._hostingSubscription
          const filteredResult = R.filter(isHubSubscr, elem.items)
          result = result.concat(filteredResult)
        } else {
          result = result.concat(elem.items)
        }
      }
    })
  }
  return result
}
