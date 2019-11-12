/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2016, 2019. All Rights Reserved.
 *
 * US Government Users Restricted Rights - Use, duplication or disclosure
 * restricted by GSA ADP Schedule Contract with IBM Corp.
 *******************************************************************************/

const React = require('react')
const renderer = require('react-test-renderer')
const ApplicationDeploymentHighlightsTerminology = require('../ApplicationDeploymentHighlightsTerminology')
  .default

describe('ApplicationDeploymentHighlights', () => {
  it('ApplicationDeploymentHighlights renders correctly.', () => {
    const tree = renderer
      .create(<ApplicationDeploymentHighlightsTerminology />)
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
