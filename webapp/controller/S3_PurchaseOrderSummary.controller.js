sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"./BaseController",
	"./ApprovalDialog"
], function(JSONModel, BaseController, ApprovalDialog) {
	"use strict";

	return BaseController.extend("nw.epm.refapps.ext.po.apv.controller.S3_PurchaseOrderSummary", {
		//_oSubControllerForApproval: helper for the approval dialog

		onInit: function() {
			this.setModel(new JSONModel(), "viewProperties"); // used by ApprovalDialog fragment
		},

		// Event handler is called after the items are updated in the summary table
		onTableUpdateFinished: function(oEvent) {
			/**
			 * @ControllerHook Adaptation of summary table
			 * This method is called after the data of the summary table has been updated due to selection or deselection of
			 * one of the purchase orders in the master list.
			 * @callback nw.epm.refapps.ext.po.apv.controller.S3_PurchaseOrderSummary~extHookOnTableUpdateFinished
			 * @param {sap.ui.base.Event} the 'updateFinished' event triggered by sap.m.Table control
			 * @return {void}
			 */
			if (this.extHookOnTableUpdateFinished) {
				this.extHookOnTableUpdateFinished(oEvent);
			}
		},

		// Event handler for buttons 'Approve All' and 'Reject All' that is attached declaratively
		onApprovalButtonPressed: function(oEvent) {
			if (this.getModel("appProperties").getProperty("/busy")) {
				return;
			}
			if (!this._oSubControllerForApproval) {
				this._oSubControllerForApproval = new ApprovalDialog(this.getView());
			}
			this._oSubControllerForApproval.openDialog(oEvent);
		},

		onNavBack: function() {
			this.getModel("appProperties").getProperty("/appControl").backMaster();
		}
	});
});