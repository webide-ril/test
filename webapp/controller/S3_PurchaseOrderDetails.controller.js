sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"./BaseController",
	"./ApprovalDialog"
], function(JSONModel, BaseController, ApprovalDialog) {
	"use strict";

	return BaseController.extend("nw.epm.refapps.ext.po.apv.controller.S3_PurchaseOrderDetails", {
		//_oSubControllerForApproval: helper for the approval dialog
		//_oSubControllerForShare: helper for the share dialog

		onInit: function() {
			// Initialize the attributes
			this.setModel(new JSONModel({
				itemListCount: 0
			}), "viewProperties"); // also used by ApprovalDialog fragment
			this.getRouter().getRoute("PurchaseOrderDetails").attachPatternMatched(this.onPOMatched, this);
		},

		// This method is registered with the router in onInit. Therefore, it is called whenever the URL is changed.
		// Note that there are two possible reasons for such a change:
		// - The user has entered a URL manually (or using browser facilities, such as a favorite)
		// - Navigation to a route was triggered programmatically
		onPOMatched: function(oEvent) {
			var sPOId = decodeURIComponent(oEvent.getParameter("arguments").POId);
			this.getModel("appProperties").setProperty("/currentPOId", sPOId);
			this._bindView("/PurchaseOrders('" + sPOId + "')");
		},

		// If PO has changed refresh context path for view and binding for table of PO items.
		_bindView: function(sPath) {
			var oAppModel = this.getModel("appProperties"),
				fnOnElementBindingCompleted = function(oEvent) {
					var oPurchaseOrder = this.getModel().getObject(oEvent.getSource().getPath());
					this.getEventBus().publish("nw.epm.refapps.ext.po.apv", "dataLoaded", {
						purchaseOrder: oPurchaseOrder
					});
					if (oPurchaseOrder === undefined) {
						return;
					}
					this.getModel("viewProperties").setProperty("/saveAsTileTitle", this.getResourceBundle().getText("xtit.saveAsTileTitle", [
						oPurchaseOrder.POId
					]));

					/**
					 * @ControllerHook Adaptation of purchase order details view
					 * This method is called after the data of the requested purchase order has been loaded to be shown on the detail view
					 * @callback nw.epm.refapps.ext.po.apv.controller.S3_PurchaseOrderDetails~extHookOnDataReceived
					 * @param {object} requested purchase order
					 * @return {void}
					 */
					if (this.extHookOnDataReceived) {
						this.extHookOnDataReceived(oPurchaseOrder);
					}
				}.bind(this);

			this.getView().bindElement({
				events: {
					change: fnOnElementBindingCompleted,
					dataRequested: function() {
						oAppModel.setProperty("/busy", true);
					},
					dataReceived: function() {
						oAppModel.setProperty("/busy", false);
					}
				},
				path: sPath,
				parameters: {
					select: "POId,OrderedByName,SupplierName,GrossAmount,CurrencyCode,ChangedAt,DeliveryDateEarliest,LaterDelivDateExist,DeliveryAddress,ItemCount"
				}
			});
		},

		// Event handler for the table of PO items that is attached declaratively
		onUpdateFinished: function(oEvent) {
			this.getModel("viewProperties").setProperty("/itemListCount", oEvent.getParameter("total"));
		},

		// Event handler for buttons 'Approve' and 'Reject' that is attached declaratively
		onApprovalButtonPressed: function(oEvent) {
			if (this.getModel("appProperties").getProperty("/busy")) {
				return;
			}
			if (!this._oSubControllerForApproval) {
				this._oSubControllerForApproval = new ApprovalDialog(this.getView());
			}
			this._oSubControllerForApproval.openDialog(oEvent);
		},

		// Event handler for opening the Share sheet containing the standard "AddBookmark" button.
		onShareButtonPressed: function(oEvent) {
			var oShareSheet = this.getView().byId("shareSheet");
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), oShareSheet);
			oShareSheet.openBy(oEvent.getSource());
		},

		onShareEmailPressed: function() {
			var oPurchaseOrder = this.getView().getBindingContext().getObject(),
				oResourceBundle = this.getModel("i18n").getResourceBundle(),
				sSubject = oResourceBundle.getText("xtit.emailSubject", [oPurchaseOrder.POId]),
				sContent = oResourceBundle.getText("xtit.emailContent", [oPurchaseOrder.POId, oPurchaseOrder.SupplierName]);
			sap.m.URLHelper.triggerEmail(null, sSubject, sContent);
		}

	});
});