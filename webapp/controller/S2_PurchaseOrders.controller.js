sap.ui.define([
	"sap/m/ListMode",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/FilterType",
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"./BaseController",
	"./messages",
	"nw/epm/refapps/ext/po/apv/model/approver"
], function(ListMode, Filter, FilterOperator, FilterType, JSONModel, Device, BaseController, messages, approver) {
	"use strict";

	return BaseController.extend("nw.epm.refapps.ext.po.apv.controller.S2_PurchaseOrders", {
		//_sCurrentSearchTerm: search term that is currently used to filter the result list
		//_oView: this view
		//_oList: master list
		//_oModel: the oData model
		//_oResourceBundle: resource bundle of the application
		//_oAppModel: the app model with global data
		//_oViewModel: JSON model to bind local data to the view

		onInit: function() {
			this._oView = this.getView();
			this._oList = this.byId("masterList");
			this._oModel = this.getModel();
			this._oModel.attachMetadataLoaded(this.onMetadataLoaded, this);
			this._oModel.attachMetadataFailed(this.onMetadataRequestFailed, this); // Register for error events on the oData model
			this._oResourceBundle = this.getResourceBundle();
			this._oViewModel = new JSONModel({
				masterListCount: 0,
				isMultiSelect: false
			});
			this.setModel(this._oViewModel, "viewProperties");
			this.getRouter().attachBypassed(this.onBypassed, this);
			var fnOnApprovalExecuted = function() {
					this.onApprovalExecuted("");
				},
				oEventBus = this.getEventBus();
			// Subscribe to event that is triggered by other screens when a PO was approved or rejected
			oEventBus.subscribe("nw.epm.refapps.ext.po.apv", "approvalExecuted", fnOnApprovalExecuted.bind(this));
			oEventBus.subscribe("nw.epm.refapps.ext.po.apv", "dataLoaded", this.onDataLoaded.bind(this));
		},

		// --- Methods dealing with list selection and refresh

		// Event handler for the multi-selection button in the page header. It is attached declaratively.
		onMultiSelectPressed: function() {
			if (this.getModel("appProperties").getProperty("/busy")) {
				return;
			}
			var bIsMultiselect = !this._oViewModel.getProperty("/isMultiSelect");
			this._oViewModel.setProperty("/isMultiSelect", bIsMultiselect);
			if (bIsMultiselect) {
				this._resetPOSelection();
				if (!Device.system.phone) {
					this._oList.removeSelections(true);
					this._showSummaryPage();
				}
			} else if (!Device.system.phone) {
				if (this._oList.getItems().length === 0) {
					this._showEmptyPage(this._oResourceBundle.getText("ymsg.noPurchaseOrders"));
				} else {
					this._setItem();
				}
			}
		},

		// Event handler for the case that the user selects one item in the master list.
		// Note: This method is referred twice in the declarative definition of this view.
		// The first reference is event 'selectionChange' of the master list; the second one is 'press' on the list item.
		// The second reference is needed in case the list mode is 'None' (which is true on phone).
		onItemSelect: function(oEvent) {
			var oListItem = oEvent.getParameter("listItem") || oEvent.getSource(),
				oSelectedPO = oListItem.getBindingContext().getObject();
			if (this._oViewModel.getProperty("/isMultiSelect")) {
				this._updatePOSelection(oSelectedPO, oEvent.getParameter("selected"));
			} else {
				// Hides the master in portrait mode after each selection
				this.getModel("appProperties").getProperty("/appControl").hideMaster();
				this._navToDetails(oListItem);
			}
		},

		_updatePOSelection: function(oSelectedPO, bIsSelect) {
			var i, aPurchaseOrders = this.getModel("appProperties").getProperty("/selectedPurchaseOrders").slice(0);
			if (bIsSelect) {
				aPurchaseOrders.push(oSelectedPO);
			} else {
				for (i = 0; i < aPurchaseOrders.length; i++) {
					if (aPurchaseOrders[i].POId === oSelectedPO.POId) {
						aPurchaseOrders.splice(i, 1);
						break;
					}
				}
			}
			this.getModel("appProperties").setProperty("/selectedPurchaseOrders", aPurchaseOrders);
		},

		_resetPOSelection: function() {
			this.getModel("appProperties").setProperty("/selectedPurchaseOrders", []);
		},

		// Event handler for the master list. It is attached declaratively.
		onUpdateFinished: function(oEvent) {
			var iPOCount = oEvent.getParameter("total");
			this._oViewModel.setProperty("/masterListCount", iPOCount);
			if (this._oList.getMode() !== ListMode.SingleSelectMaster) {
				return;
			}
			if (iPOCount === 0) {
				if (!this._sCurrentSearchTerm || this.getModel("appProperties").getProperty("/currentPOId") === "") {
					this._showEmptyPage(this._oResourceBundle.getText("ymsg.noPurchaseOrders"));
				}
				return;
			}
			this._setItem();
		},

		// Triggered via event bus by S3 details view after loading data
		onDataLoaded: function(sChannelId, sEventId, mParameter) {
			if (!mParameter.purchaseOrder) {
				this._showEmptyPage(this._oResourceBundle.getText("ymsg.poUnavailable"));
				return;
			}
			if (Device.system.phone) {
				this.getModel("appProperties").setProperty("/selectedPurchaseOrders", [mParameter.purchaseOrder]);
				return;
			}
			this._setItem();
		},

		// This method ensures that a PO is selected. This is either the PO with ID sTargetPOId or the first PO in the master list.
		_setItem: function() {
			var aItems = this._oList.getItems();
			if (aItems.length === 0) {
				return;
			}
			var i, sTargetPOId = this.getModel("appProperties").getProperty("/currentPOId"),
				oItemToSelect = aItems[0]; // Fallback: Display the first PO in the list

			if (sTargetPOId) { // But if another PO is required: Try to select this one
				for (i = 0; i < aItems.length; i++) {
					if (aItems[i].getBindingContext().getProperty("POId") === sTargetPOId) {
						oItemToSelect = aItems[i];
						break;
					}
				}
			}
			oItemToSelect.setSelected(true);
			this.getModel("appProperties").setProperty("/selectedPurchaseOrders", [oItemToSelect.getBindingContext().getObject()]);
			this._navToDetails(oItemToSelect); // display the item on the detail page
		},

		// Event handler for the pullToRefresh-element of the list. It is attached declaratively.
		onPullToRefresh: function(oEvent) {
			var oPullToRefresh = oEvent.getSource();
			// Hide the pull to refresh when data has been loaded
			this._oList.attachEventOnce("updateFinished", function() {
				// Note: Do not use oEvent here, because UI5 might have reinitialized this instance already (instance pooling for performance reasons)
				oPullToRefresh.hide();
			});
			this._getListBinding().refresh();
		},

		// This method is called when an approve/reject action was successfully executed.
		// This is caused by one of the following two alternatives:
		// - User has used an Approve/Reject button on the detail page
		// - User has used swipe action on the master list
		// As the approved/rejected PO will be removed from the list, the list needs to be refreshed.
		// Moreover (when the app is not being used on a phone), the PO selection needs to be updated if the removed PO was the selected one.
		// This is always the case for the first alternative and might or might not be the case for the second alternative.
		// Parameter sSwipedPOId is passed for the second reason to indicate the ID of the removed PO.
		// If the selected PO is indeed the removed one the selection should change to the next list entry
		// or to the previous one, when we are already at the end of the list.
		onApprovalExecuted: function(sSwipedPOId) {
			if (!Device.system.phone) {
				var oSelectedItem = this._oList.getSelectedItem(),
					nextPOId = this._getNextPOId(oSelectedItem && oSelectedItem.getBindingContext().getProperty("POId"), sSwipedPOId);
				this.getModel("appProperties").setProperty("/currentPOId", nextPOId);
			}
			this._resetPOSelection();
			// The next line makes sure that the focus is set correctly in order to avoid a movement of the selected item within the list.
			this._oList.attachEventOnce("updateFinished", this._oList.focus, this._oList);
			// Now (when the app is not being used on a phone) the PO which should be selected after the list update is specified by currentPOId.
			// This will be evaluated by method _setItem after the list has been refreshed, which is triggered now.
			this._getListBinding().refresh();
		},

		_getNextPOId: function(sSelectedPOId, sSwipedPOId) {
			var oNextItem, i, aItems = this._oList.getItems(),
				// If sSwipedPOId is given the currently selected PO should stay selected if it is not the removed one
				sNextPOId = sSwipedPOId && sSwipedPOId !== sSelectedPOId && sSelectedPOId;
			for (i = 0; i < aItems.length && !sNextPOId; i++) {
				if (aItems[i].getBindingContext().getProperty("POId") === sSelectedPOId) {
					oNextItem = aItems[i === aItems.length - 1 ? (i - 1) : (i + 1)];
					sNextPOId = oNextItem && oNextItem.getBindingContext().getProperty("POId");
				}
			}
			return sNextPOId;
		},

		_getListBinding: function() {
			return this._oList.getBinding("items");
		},

		// --- Methods dealing with search

		// Event handler for the search field in the master list. It is attached declaratively.
		// Note that this handler listens to the search button and to the refresh button in the search field
		onSearch: function(oEvent) {
			if (oEvent.getParameter("refreshButtonPressed")) {
				this._getListBinding().refresh();
				return;
			}
			this._sCurrentSearchTerm = oEvent.getSource().getValue();
			var aFilters = [];
			if (this._sCurrentSearchTerm) {
				aFilters.push(new Filter("SupplierName", FilterOperator.Contains, this._sCurrentSearchTerm));
			}
			// Set filters on list. Note that this replaces existing filters.
			this._getListBinding().filter(aFilters, FilterType.Application);
		},

		// --- Methods dealing with swipe

		// Event handler for swipe in the list. It is attached declaratively.
		// Its purpose is to deactivate swipe in case of multi select mode.
		onSwipe: function(oEvent) {
			if (this._oViewModel.getProperty("/isMultiSelect") || this.getModel("appProperties").getProperty("/busy")) {
				oEvent.preventDefault();
			}
		},

		// Event handler for the swipe action of a list item. It is attached declaratively.
		onSwipeApprove: function() {
			var oSwipedPO = this._oList.getSwipedItem().getBindingContext().getObject();
			this.getModel("appProperties").setProperty("/selectedPurchaseOrders", [oSwipedPO]);
			approver.approve(this._oView, true, "", this.onApprovalExecuted.bind(this, oSwipedPO.POId));
			this._oList.swipeOut();
		},

		// --- Methods dealing with routing

		// This method triggers the navigation to the detail page with the specified list item oListItem
		_navToDetails: function(oListItem) {
			var oRouter = this.getRouter();
			oRouter.getTargets().display(["object", "master"]);
			oRouter.navTo("PurchaseOrderDetails", {
				POId: encodeURIComponent(oListItem.getBindingContext().getProperty("POId"))
			}, !Device.system.phone);
		},

		// Event handler for the process button of the page footer. It is attached declaratively.
		onProcessPressed: function() {
			this._showSummaryPage();
		},

		// This method displays the summary screen
		// The summary screen does not need to be accessible via URL, therefore there is no route for it.
		// Therefore, we use UI5 low-level api for navigating to the summary page.
		_showSummaryPage: function() {
			this.getRouter().getTargets().display("summary");
		},

		onBypassed: function() {
			this._showEmptyPage(this._oResourceBundle.getText("ymsg.pageNotFound"));
		},

		// If no PO is available, we display the empty screen on the detail page.
		// The empty screen does not need to be accessible via URL, therefore there is no route for it.
		// Therefore, we use UI5 low-level api for navigating to the empty page.
		_showEmptyPage: function(sMessageText) {
			this._oList.removeSelections(true);
			this.getModel("appProperties").setProperty("/emptyPageText", sMessageText);
			this.getRouter().getTargets().display("notFound");
		},

		onNavBack: function() {
			var oHistory = sap.ui.core.routing.History.getInstance(),
				sPreviousHash = oHistory.getPreviousHash(),
				oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
			if (sPreviousHash !== undefined || !oCrossAppNavigator.isInitialNavigation()) {
				history.go(-1);
			} else {
				oCrossAppNavigator.toExternal({
					target: {
						shellHash: "#"
					}
				});
			}
		},

		// --- Methods dealing with error handling

		onMetadataLoaded: function() {
			this.getModel("appProperties").setProperty("/busy", false);
		},

		onMetadataRequestFailed: function(oResponse) {
			messages.showErrorMessage(oResponse, this._oResourceBundle.getText("xtit.errorTitle"));
		}
	});
});