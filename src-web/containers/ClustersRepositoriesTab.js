/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2018. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/
'use strict'

import React from 'react'
import { withRouter } from 'react-router-dom'
import AddRepoActionAndModal from '../components/modals/AddRepoActionAndModal'
import { RESOURCE_TYPES } from '../../lib/shared/constants'
import { typedResourcePageWithList } from '../components/common/ResourcePage'


const addRepo = <AddRepoActionAndModal key='addRepoActionAndModal' />

export default withRouter(typedResourcePageWithList(RESOURCE_TYPES.HCM_REPOSITORIES, null, [addRepo]))
