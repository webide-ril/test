// Functions supporting the approval dialog

sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/Device",
	"./designMode",
	"nw/epm/refapps/ext/po/apv/model/approver",
	"nw/epm/refapps/ext/po/apv/model/formatter"
], function(Object, Device, designMode, approver, formatter) {
	"use strict";

	return Object.extend("nw.epm.refapps.ext.po.apv.controller.ApprovalDialog", {
		//_oParentView: parent view
		//_oViewModel: JSON model to bind local data to the vie
		//_oDialog: approval dialog which is instantiated on the first request
		formatter: formatter,

		constructor: function(oParentView) {
			this._oParentView = oParentView;
			this._oViewModel = this.getModel("viewProperties");
		},

		// Opens the approval dialog
		openDialog: function(oEvent) {
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment(this._oParentView.getId(), "nw.epm.refapps.ext.po.apv.view.ApprovalDialog", this);
				designMode.syncStyleClass(this._oParentView, this._oDialog);
				this._oParentView.addDependent(this._oDialog);
			}
			this._oViewModel.setProperty("/isApproval", oEvent.getSource().getType() === "Accept");
			this._oViewModel.setProperty("/approvalNote", "");
			this._oDialog.open();
		},

		// Event handler for the confirm action of the approval dialog. Note that this event handler is attached declaratively
		// in the definition of fragment nw.epm.refapps.ext.po.apv.view.fragment.ApprovalDialog.
		onConfirmAction: function() {
			this.getModel("appProperties").setProperty("/busy", true);
			this._oDialog.close();
			var bApprove = this._oViewModel.getProperty("/isApproval"),
				sApprovalNote = this._oViewModel.getProperty("/approvalNote");
			// The approval action itself is delegated to a utility function. Note that this function is also responsible for hiding the busy indicator.
			approver.approve(this._oParentView, bApprove, sApprovalNote, this.onApprovalSuccess.bind(this));
		},

		// Event handler for the cancel action of the approval dialog. Note that this event handler is attached declaratively
		// in the definition of fragment nw.epm.refapps.ext.po.apv.view.fragment.ApprovalDialog.
		onCancelAction: function() {
			this._oDialog.close();
		},

		// This event handler is called when an approve/reject action has been performed successfully.
		onApprovalSuccess: function() {
			var oController = this._oParentView.getController();
			// Broadcast the information about the successfull approve/reject action. Actually, only master view is listening.
			oController.getEventBus().publish("nw.epm.refapps.ext.po.apv", "approvalExecuted");
			// When the app is being used on a phone leave detail screen and go back to master
			if (Device.system.phone) {
				oController.onNavBack();
			}
		},

		// This function is also used by the formatter!
		getModel: function(sName) {
			return this._oParentView.getModel(sName);
		}
	});
});