/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import {
  pageLoader,
  resourceTable,
  modal,
  noResource,
  notification,
  validateSubscriptionTable,
  getSingleAppClusterTimeDetails
} from "./common";

import { channelsInformation } from "./resources.js";

export const createApplication = (clusterName, data, type) => {
  cy.visit("/multicloud/applications");
  // wait for create button to be enabled
  cy.get("[data-test-create-application=true]", { timeout: 50 * 1000 }).click();
  cy.log(`Test create application ${name}`);
  const { name, config } = data;
  cy.get(".bx--detail-page-header-title-container").should("exist");
  cy.get("#name", { timeout: 50 * 1000 }).type(name);
  cy.get("#namespace", { timeout: 50 * 1000 }).type(`${name}-ns`);
  if (type === "git") {
    createGit(clusterName, config);
  } else if (type === "objectstore") {
    createObj(clusterName, config);
  } else if (type === "helm") {
    createHelm(clusterName, config);
  }
  submitSave();
};

export const gitTasks = (clusterName, value, gitCss, key = 0) => {
  const { url, username, token, branch, path, timeWindow, deployment } = value;
  const { gitUrl, gitUser, gitKey, gitBranch, gitPath } = gitCss;
  cy
    .get(`#github`)
    .click()
    .trigger("mouseover");
  cy
    .get(gitUrl, { timeout: 20 * 1000 })
    .type(url, { timeout: 30 * 1000 })
    .blur();
  if (username && token) {
    cy.get(gitUser).type(username);
    cy.get(gitKey).type(token);
  }

  // wait for form to remove the users
  cy.wait(1000);
  // type in branch and path
  cy
    .get(gitBranch, { timeout: 20 * 1000 })
    .type(branch, { timeout: 30 * 1000 })
    .blur();
  cy.wait(1000);
  cy
    .get(gitPath, { timeout: 20 * 1000 })
    .type(path, { timeout: 30 * 1000 })
    .blur();
  selectClusterDeployment(deployment, clusterName, key);
  selectTimeWindow(timeWindow, key);
};

export const createHelm = (clusterName, configs) => {
  let helmCss = {
    helmURL: "#helmURL",
    helmChartName: "#helmChartName",
    helmPackageVersion: "#helmPackageVersion"
  };
  for (const [key, value] of Object.entries(configs)) {
    key == 0
      ? helmTasks(clusterName, value, helmCss)
      : multipleTemplate(clusterName, value, helmCss, key, helmTasks);
  }
};

export const helmTasks = (clusterName, value, css, key = 0) => {
  const { url, chartName, packageVersion, timeWindow, deployment } = value;
  const { helmURL, helmChartName, helmPackageVersion } = css;
  cy
    .get("#helmrepo")
    .click()
    .trigger("mouseover");
  cy
    .get(helmURL, { timeout: 20 * 1000 })
    .type(url, { timeout: 30 * 1000 })
    .blur();
  cy
    .get(helmChartName, { timeout: 20 * 1000 })
    .type(chartName)
    .blur();
  packageVersion &&
    cy
      .get(helmPackageVersion, { timeout: 20 * 1000 })
      .type(packageVersion)
      .blur();
  selectClusterDeployment(deployment, clusterName, key);
  selectTimeWindow(timeWindow, key);
};

export const createGit = (clusterName, configs) => {
  let gitCss = {
    gitUrl: "#githubURL",
    gitUser: "#githubUser",
    gitKey: "#githubAccessID",
    gitBranch: "#githubBranch",
    gitPath: "#githubPath"
  };
  for (const [key, value] of Object.entries(configs)) {
    key == 0
      ? gitTasks(clusterName, value, gitCss)
      : multipleTemplate(clusterName, value, gitCss, key, gitTasks);
  }
};

export const createObj = (clusterName, configs) => {
  let objCss = {
    objUrl: "#objectstoreURL",
    objAccess: "#accessKey",
    objSecret: "#secretKey"
  };
  for (const [key, value] of Object.entries(configs)) {
    key == 0
      ? objTasks(clusterName, value, objCss)
      : multipleTemplate(clusterName, value, objCss, key, objTasks);
  }
};

export const objTasks = (clusterName, value, css, key = 0) => {
  const { url, accessKey, secretKey, timeWindow, deployment } = value;
  const { objUrl, objAccess, objSecret } = css;
  cy
    .get("#objectstore")
    .click()
    .trigger("mouseover");
  cy.get(objUrl, { timeout: 20 * 1000 }).type(url, { timeout: 30 * 1000 });
  cy.get(objAccess).then(input => {
    if (input.is("enabled")) {
      cy.get(objAccess).type(accessKey);
      cy.get(objSecret).type(secretKey);
    } else {
      cy.log(`credentials have not been saved...`);
    }
  });
  selectClusterDeployment(deployment, clusterName, key);
  selectTimeWindow(timeWindow, key);
};

export const multipleTemplate = (clusterName, value, css, key, func) => {
  Object.keys(css).forEach(k => (css[k] = css[k] + `grp${key}`));
  cy.get("#add-channels").click();
  cy
    .get(".creation-view-group-container")
    .eq(key)
    .within($content => {
      func(clusterName, value, css, key);
    });
};

export const submitSave = () => {
  modal.shouldNotBeDisabled();
  modal.clickSubmit();
  cy
    .get("#notifications", { timeout: 50 * 1000 })
    .scrollIntoView({ offset: { top: -500, left: 0 } });
  notification.shouldExist("success", { timeout: 60 * 1000 });
  cy.location("pathname", { timeout: 60 * 1000 }).should("include", `${name}`);
};

export const validateSubscriptionDetails = (name, data, type) => {
  // as soon as details button is enabled we can proceed
  cy
    .get("[data-test-subscription-details=true]", { timeout: 50 * 1000 })
    .scrollIntoView()
    .click();
  for (const [key, value] of Object.entries(data.config)) {
    // some subscriptions might not have time window
    const type = value.timeWindow ? value.timeWindow.type : "active"; //if not defined is always active
    cy.log(`Validate subscriptions cards for ${name} key=${key}`);
    const keywords = {
      blockinterval: "Blocked",
      activeinterval: "Active",
      active: "Set time window"
    };
    cy
      .get(".overview-cards-subs-section", { timeout: 20 * 1000 })
      .children()
      .eq(key)
      .within($subcards => {
        cy.log(`Validate time window for subscription is ${keywords[type]}`);
        type == "active"
          ? cy
              .get(".set-time-window-link", { timeout: 20 * 1000 })
              .contains(keywords[type])
          : cy
              .get(".timeWindow-status-icon", { timeout: 20 * 1000 })
              .contains(keywords[type].toLowerCase());

        cy.log("Validate subscription repository info");
        let repositoryText =
          data.type === "objectstore"
            ? "Object storage"
            : data.type === "helm" ? "Helm" : "Git";
        cy
          .get(".pf-c-label__content")
          .first()
          .invoke("text")
          .should("include", repositoryText);

        cy.log("Validate Repository popup");
        let repoInfo = value.url;
        if (value.branch && value.branch.length > 0) {
          repoInfo = `${repoInfo}Branch:${value.branch}`;
        }
        if (value.path && value.path.length > 0) {
          repoInfo = `${repoInfo}Path:${value.path}`;
        }
        cy
          .get(".pf-c-label")
          .first()
          .click();
        //TODO: validate git path and repo info here
        /*         
            cy
            .get(".channel-entry-attribute")
            .invoke("text")
            .should("include", repoInfo);
            */
        cy
          .get(".subs-icon")
          .first()
          .click(); //close any popups
      });
  }
};

export const validateAdvancedTables = (
  name,
  data,
  type,
  numberOfRemoteClusters
) => {
  cy.log(
    `Execute validateAdvancedTables for name=${name}, data.config=${
      data.config
    }`
  );
  for (const [key, subscriptionItem] of Object.entries(data.config)) {
    const { local, online, matchingLabel } = subscriptionItem.deployment;
    channelsInformation(name, key).then(({ channelName }) => {
      let resourceTypes = {
        subscriptions: `${name}-subscription-${parseInt(key) + 1}`,
        placementrules: `${name}-placement-${parseInt(key) + 1}`,
        channels: channelName
      };
      cy.log(`Validate instance-${key} with channel name ${channelName}`);
      Object.keys(resourceTypes).map(function(tableType) {
        cy.log(`Validating now the ${tableType} table for app ${name}`);
        if (local && tableType == "placementrules") {
          cy.log(
            `no placementrules for app - ${name} because it has been deployed locally`
          );
        } else {
          cy.log(`Validating ${tableType} on Advanced Tables`);
          cy.visit(`/multicloud/applications/advanced?resource=${tableType}`);
          cy
            .get("#undefined-search", { timeout: 500 * 1000 })
            .type(resourceTypes[tableType]);
          resourceTable.rowShouldExist(resourceTypes[tableType], 600 * 1000);
          validateSubscriptionTable(
            resourceTypes[tableType],
            tableType,
            subscriptionItem,
            numberOfRemoteClusters
          );
        }
      });
    });
  }
};

export const validateTopology = (name, data, type, numberOfRemoteClusters) => {
  cy.visit(`/multicloud/applications/${name}-ns/${name}`);
  cy.reload();
  cy
    .get(".search-query-card-loading", { timeout: 100 * 1000 })
    .should("not.exist");
  cy.get("#left-col").contains(name);
  cy.get("#left-col").contains(`${name}-ns`);

  const appDetails = getSingleAppClusterTimeDetails(
    data,
    numberOfRemoteClusters
  );
  cy.log(
    `Verify cluster deploy status on app card is ${appDetails.clusterData}`
  );
  cy.get(".overview-cards-details-section").contains(appDetails.clusterData);

  const successNumber = data.successNumber; // this needs to be set in the yaml as the number of resources that should show success for this app
  cy.log(
    `Verify that the deployed resources number with status success is at least ${successNumber}`
  );
  cy
    .get("#green-resources")
    .children(".status-count")
    .invoke("text")
    .then(parseInt)
    .should("be.gte", successNumber);

  validateSubscriptionDetails(name, data, type);

  cy.get(".overview-cards-container");
  cy.get("#topologySvgId", { timeout: 50 * 1000 });
  cy.get(".layoutLoadingContainer").should("not.be.visible");
  cy.get(".bx--loading", { timeout: 50 * 1000 }).should("not.be.visible", {
    timeout: 100 * 1000
  });
  // application
  cy.log("validate the application...");
  cy.get(`g[type=${name}]`, { timeout: 25 * 1000 }).should("be.visible");

  //subscription
  cy.log("validate the subscription...");
  cy
    .get(`g[type="${name}-subscription-1"]`, { timeout: 25 * 1000 })
    .should("be.visible");

  // cluster and placement
  for (const [key, value] of Object.entries(data.config)) {
    const { local, online } = value.deployment;
    !local
      ? (validatePlacementNode(name, key),
        !online && validateClusterNode(Cypress.env("managedCluster"))) //ignore online placements since the app is deployed on all online clusters here and we don't know for sure how many remote clusters the hub has
      : cy.log(
          "cluster and placement nodes will not be created as the application is deployed locally"
        );
  }

  data.config.forEach(data => {
    const { path } = type == "git" ? data : data;
    //path == "helloworld" ? validateHelloWorld() : null;
  });
};

export const validateClusterNode = (clusterName = "magchen-ocp") => {
  cy.log("validating the cluster...");
  cy
    .get(`g[type="${clusterName}"]`, { timeout: 25 * 1000 })
    .should("be.visible");
};

export const validatePlacementNode = (name, key) => {
  cy.log("validate the placementrule..."),
    cy
      .get(`g[type="${name}-placement-${parseInt(key) + 1}"]`, {
        timeout: 25 * 1000
      })
      .should("be.visible");
};

export const validateHelloWorld = () => {
  // validate route
  cy.log("validate the route...");
  cy.scrollTo("bottom");
  cy
    .get('g[type="helloworld-app-route"]', {
      timeout: 100 * 1000
    })
    .should("be.visible")
    .click();
  cy
    .get(".topologyDetails")
    .children(".details-view-container")
    .find(">div")
    .first()
    .within($div => {
      cy
        .get("#linkForNodeAction", { timeout: 200 * 1000 })
        .contains("http://")
        .invoke("text")
        .then(urlLink => {
          cy
            .exec(`curl ${urlLink}`)
            .its("stdout")
            .should("not.be", "empty");
        });
    });
};

export const validateAppTableMenu = (name, resourceTable) => {
  //validate SEARCH menu

  if (name != "ui-git") {
    // check popup actions on one app only, that's sufficient
    return;
  }
  resourceTable.openRowMenu(name);
  cy
    .get('button[data-table-action="table.actions.applications.search"]', {
      timeout: 20 * 1000
    })
    .click({ force: true });
  cy
    .url()
    .should(
      "include",
      `multicloud/search?filters={%22textsearch%22:%22name%3A${name}%20namespace%3A${name}-ns%20kind%3Aapplication%20apigroup%3Aapp.k8s.io%22}`
    );

  //get back to app page
  cy.visit(`/multicloud/applications`);
  cy.get(".search-query-card-loading").should("not.exist", {
    timeout: 60 * 1000
  });
  pageLoader.shouldNotExist();
  cy.get("#undefined-search", { timeout: 500 * 1000 }).type(name);
  resourceTable.rowShouldExist(name, 600 * 1000);
  //END SEARCH menu validation

  //validate Edit menu
  resourceTable.openRowMenu(name);
  resourceTable.menuClickEdit();
  cy.get(".bx--detail-page-header-title").should("exist", {
    timeout: 60 * 1000
  });
  //get back to app page
  cy.visit(`/multicloud/applications`);
  cy.get(".search-query-card-loading").should("not.exist", {
    timeout: 60 * 1000
  });
  pageLoader.shouldNotExist();
  cy.get("#undefined-search", { timeout: 500 * 1000 }).type(name);
  resourceTable.rowShouldExist(name, 600 * 1000);
  //END Edit menu validation

  //validate View menu
  resourceTable.openRowMenu(name);
  resourceTable.menuClickView();
  cy.get(".resourceDiagramSourceContainer").should("exist", {
    timeout: 60 * 1000
  });
  //get back to app page
  cy.visit(`/multicloud/applications`);
  cy.get(".search-query-card-loading").should("not.exist", {
    timeout: 60 * 1000
  });
  pageLoader.shouldNotExist();
  cy.get("#undefined-search", { timeout: 500 * 1000 }).type(name);
  resourceTable.rowShouldExist(name, 600 * 1000);
  //END View menu validation
};

export const validateResourceTable = (name, data, numberOfRemoteClusters) => {
  cy.visit(`/multicloud/applications`);
  cy.get(".search-query-card-loading").should("not.exist", {
    timeout: 60 * 1000
  });
  pageLoader.shouldNotExist();
  cy.get("#undefined-search", { timeout: 500 * 1000 }).type(name);
  resourceTable.rowShouldExist(name, 600 * 1000);

  //validate content
  cy
    .get(".resource-table")
    .get(`tr[data-row-name="${name}"]`)
    .get("td")
    .eq(0)
    .invoke("text")
    .should("eq", name);
  cy
    .get(".resource-table")
    .get(`tr[data-row-name="${name}"]`)
    .get("td")
    .eq(1)
    .invoke("text")
    .should("eq", `${name}-ns`);

  const appDetails = getSingleAppClusterTimeDetails(
    data,
    numberOfRemoteClusters
  );
  cy.log("Validate Cluster column");
  cy
    .get(".resource-table")
    .get(`tr[data-row-name="${name}"]`)
    .get("td")
    .eq(2)
    .invoke("text")
    .should("eq", appDetails.clusterData);

  const popupDefaultText =
    "Provide a description that will be used as the title";
  const subscriptionLength = data.config.length;
  let repositoryText =
    data.type === "objectstore"
      ? "Object storage"
      : data.type === "helm" ? "Helm" : "Git";
  repositoryText =
    subscriptionLength > 1
      ? `${repositoryText} (${subscriptionLength})`
      : repositoryText;
  repositoryText = `${repositoryText}${popupDefaultText}`;
  cy.log("Validate Repository column");
  cy
    .get(".resource-table")
    .get(`tr[data-row-name="${name}"]`)
    .get("td")
    .eq(3)
    .invoke("text")
    .should("eq", repositoryText);

  cy.log("Validate Repository popup");
  cy
    .get(".resource-table")
    .get(`tr[data-row-name="${name}"]`)
    .get("td")
    .eq(3)
    .click();

  data.config.forEach(item => {
    let repoInfo = `${popupDefaultText}${item.url}`;
    if (item.branch && item.branch.length > 0) {
      repoInfo = `${repoInfo}Branch:${item.branch}`;
    }
    if (item.path && item.path.length > 0) {
      repoInfo = `${repoInfo}Path:${item.path}`;
    }

    cy
      .get(".pf-l-split__item")
      .invoke("text")
      .should("include", repoInfo);
  });

  cy.log("Validate Window column");
  cy
    .get(".resource-table")
    .get(`tr[data-row-name="${name}"]`)
    .get("td")
    .eq(4)
    .invoke("text")
    .should("eq", appDetails.timeWindowData);

  if (data.type == "git") {
    cy.log("Validate popup actions");
    //validate menu for one app only, no need to check all
    validateAppTableMenu(name, resourceTable, numberOfRemoteClusters);
  }
};

//delete application resources from advanced tables
export const deleteResourceUI = (name, type) => {
  cy.visit(`/multicloud/applications/advanced?resource=${type}`);

  let resourceTypes = {
    subscriptions: `${name}-subscription-1`,
    placementrules: `${name}-placement-1`,
    channels: "hkubernetes-chartsstoragegoogleapiscom"
  };
  cy.log(
    `Verify that resource ${resourceTypes[type]} can be deleted for app ${name}`
  );

  cy
    .get("#undefined-search", { timeout: 500 * 1000 })
    .type(resourceTypes[type]);
  resourceTable.rowShouldExist(resourceTypes[type], 600 * 1000);

  resourceTable.openRowMenu(resourceTypes[type]);
  resourceTable.menuClickDelete(type);
  modal.shouldBeOpen();

  modal.clickDanger();
  modal.shouldNotBeVisible();

  // after deleting the app, it should not exist in the app table
  resourceTable.rowShouldNotExist(resourceTypes[type], 300 * 1000);
};

export const deleteApplicationUI = name => {
  cy.visit("/multicloud/applications");
  if (noResource.shouldNotExist()) {
    resourceTable.rowShouldExist(name, 600 * 1000);

    resourceTable.openRowMenu(name);
    resourceTable.menuClickDelete("applications");
    modal.shouldBeOpen();

    if (name != "ui-helm2") {
      //delete all resources
      cy.log(`Verify that the app and all resources are deleted for ${name}`);
      modal.clickResources();
    }
    modal.clickDanger();
    // after deleting the app, it should not exist in the app table
    modal.shouldNotBeVisible();
    resourceTable.rowShouldNotExist(name, 300 * 1000);
  } else {
    cy.log("No apps to delete...");
  }

  if (name == "ui-helm2") {
    //delete all resources from advanced table
    deleteResourceUI(name, "subscriptions");
    deleteResourceUI(name, "placementrules");
    deleteResourceUI(name, "channels");
  }
};

export const selectClusterDeployment = (deployment, clusterName, key) => {
  cy.log(
    `Execute selectClusterDeployment with options clusterName=${clusterName} deployment=${deployment} and key=${key}`
  );
  if (deployment) {
    const { local, online, matchingLabel } = deployment;
    cy.log(
      `cluster options are  local=${local} online=${online} matchingLabel=${matchingLabel}`
    );
    let clusterDeploymentCss = {
      localClusterID: "#local-cluster-checkbox",
      onlineClusterID: "#online-cluster-only-checkbox",
      uniqueClusterID: "#clusterSelector-checkbox-clusterSelector"
    };
    key == 0
      ? clusterDeploymentCss
      : Object.keys(clusterDeploymentCss).forEach(
          k => (clusterDeploymentCss[k] = clusterDeploymentCss[k] + `grp${key}`)
        );

    const {
      localClusterID,
      onlineClusterID,
      uniqueClusterID
    } = clusterDeploymentCss;

    if (online) {
      cy.log("Select to deploy to all online clusters including local cluster");
      cy
        .get(onlineClusterID, { timeout: 50 * 1000 })
        .click({ force: true })
        .trigger("mouseover", { force: true });
    } else if (local) {
      cy.log("Select to deploy to local cluster only");
      cy
        .get(localClusterID, { timeout: 50 * 1000 })
        .click({ force: true })
        .trigger("mouseover", { force: true });
    } else {
      cy.log(
        "Select Deploy application resources only on clusters matching specified labels, which is the default"
      );
      cy.log(`deploying app to cluster-${clusterName}`),
        selectMatchingLabel(clusterName, key);
    }
  } else {
    throw new Error(
      "no available imported OCP clusters to deploy applications"
    );
  }
};

export const selectMatchingLabel = (cluster = "magchen-ocp", key) => {
  let matchingLabelCSS = {
    labelName: "#labelName-0-clusterSelector",
    labelValue: "#labelValue-0-clusterSelector"
  };

  key == 0
    ? matchingLabelCSS
    : Object.keys(matchingLabelCSS).forEach(
        k => (matchingLabelCSS[k] = matchingLabelCSS[k] + `grp${key}`)
      );
  const { labelName, labelValue } = matchingLabelCSS;
  cy.get(labelName).type("name"), cy.get(labelValue).type(cluster);
};

export const selectTimeWindow = (timeWindow, key = 0) => {
  if (!timeWindow) {
    cy.log("timeWindow info not available, ignore this section");
    return;
  }
  const { setting, type, date, hours } = timeWindow;
  if (setting && date) {
    cy.log(`Select TimeWindow - ${type}...`);
    let typeID;
    key == 0
      ? (typeID =
          type === "blockinterval"
            ? "#blocked-mode-timeWindow"
            : "#active-mode-timeWindow")
      : (typeID =
          type === "blockinterval"
            ? `#blocked-mode-timeWindowgrp${key}`
            : `#active-mode-timeWindowgrp${key}`);

    cy
      .get(typeID)
      .scrollIntoView()
      .click({ force: true });
    selectDate(date, key);

    cy
      .get(".bx--combo-box.config-timezone-combo-box.bx--list-box")
      .within($timezone => {
        cy.get("[type='button']").click();
        cy
          .get(".bx--list-box__menu-item:first-of-type", {
            timeout: 30 * 1000
          })
          .click();
      });

    if (hours) {
      hours.forEach((interval, idx) => {
        cy.get(`#start-time-${idx}`).type(interval.start);
        cy.get(`#end-time-${idx}`).type(interval.end);

        if (idx < hours.length - 1) {
          cy.get(".add-time-btn", { timeout: 10 * 1000 }).click();
        }
      });
    }
  } else {
    cy.log("leave default `active`");
  }
};

export const selectDate = (date, key) => {
  date.forEach(d => {
    const dateId = d.toLowerCase().substring(0, 3) + "-timeWindow";
    key == 0
      ? cy.get(`#${dateId}`, { timeout: 20 * 1000 }).click({ force: true })
      : cy
          .get(`#${dateId}grp${key}`, { timeout: 20 * 1000 })
          .click({ force: true });
  });
};

export const edit = name => {
  cy
    .server()
    .route({
      method: "POST", // Route all POST requests
      url: `/multicloud/applications/graphql`
    })
    .as("graphql");
  cy.visit("/multicloud/applications");
  resourceTable.rowShouldExist(name, 600 * 1000);
  resourceTable.openRowMenu(name);
  resourceTable.menuClickEdit();
  cy.url().should("include", `/${name}`);
  // as soon as edit button is shown we can proceed
  cy.get("#edit-yaml", { timeout: 100 * 1000 });
  cy.wait(["@graphql", "@graphql"], {
    timeout: 50 * 1000
  });
};

export const editApplication = (name, data) => {
  edit(name);
  cy.log("Verify name and namespace fields are disabled");
  cy.get(".bx--detail-page-header-title-container", { timeout: 100 * 1000 });
  cy.get("#edit-yaml", { timeout: 100 * 1000 }).click({ force: true });
  cy.get(".creation-view-yaml", { timeout: 20 * 1000 });
  cy
    .get(".bx--text-input.bx--text__input", { timeout: 20 * 1000 })
    .should("be.disabled");
  cy
    .get(".bx--text-input.bx--text__input", { timeout: 20 * 1000 })
    .invoke("val")
    .should("eq", name);
  cy.get("#namespace", { timeout: 20 * 1000 }).should("be.disabled");
  cy
    .get("#namespace", { timeout: 20 * 1000 })
    .invoke("val")
    .should("eq", `${name}-ns`);
  cy.log("Verify Update button is disabled");
  modal.shouldBeDisabled();

  deleteFirstSubscription(name, data);
};

export const deleteFirstSubscription = (name, data) => {
  if (data.config.length > 1) {
    cy.log(`Verified that ${name} has ${data.config.length} subscriptions`);
    cy.log(
      `Verify that the first subscription can be deleted for ${name} application`
    );

    cy.get(".creation-view-controls-section").within($section => {
      cy
        .get(".creation-view-group-container")
        .first()
        .within($div => {
          cy.get(".creation-view-controls-delete-button").click();
        });
    });
    modal.shouldNotBeDisabled();
    modal.clickSubmit();
    notification.shouldExist("success", { timeout: 60 * 1000 });
  } else {
    cy.log(`skipping ${name} since it's a single application...`);
  }
};

export const verifyEdit = (name, data) => {
  if (data.config.length > 1) {
    edit(name);
    cy.log(
      `Verify that after edit, ${name} application has one less subscription`
    );
    cy.get(".creation-view-controls-section").within($section => {
      cy
        .get(".creation-view-group-container")
        .should("have.length", data.config.length - 1);
    });
  }
};
