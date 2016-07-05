// Utility for performing an approve/reject action

sap.ui.define([
	"sap/m/MessageToast",
	"nw/epm/refapps/ext/po/apv/controller/messages"
], function(MessageToast, messages) {
	"use strict";

	return {
		// This method performs approve/reject action on an array of PO IDs which of course might also contain only a single PO ID.
		// More precisely, it offers the following services
		// - Perform the function import for approving/rejecting in the backend
		// - Generic error handling
		// - Generic hiding of BusyIndicator
		// - Generic success message
		// Parameters:
		// - oView         - the view using this service (actually only used for retrieving models)
		// - bApprove      - flag whether this is an approve or a reject action
		// - sApprovalNote - note for this approval/rejection
		// - fnSuccess     - optional custom success handler
		approve: function(oView, bApprove, sApprovalNote, fnSuccess) {
			var sFunction = bApprove ? "/ApprovePurchaseOrder" : "/RejectPurchaseOrder",
				oModel = oView.getModel(),
				oResourceBundle = oView.getModel("i18n").getResourceBundle(),
				aPurchaseOrders = oView.getModel("appProperties").getProperty("/selectedPurchaseOrders"),
				i, aPOIds = [],
				fnOnError = function(oResponse) {
					oView.getModel("appProperties").setProperty("/busy", false);
					messages.showErrorMessage(oResponse, oResourceBundle.getText("xtit.errorTitle"));
				},
				fnOk = function() {
					oView.getModel("appProperties").setProperty("/busy", false);
					if (fnSuccess) {
						fnSuccess();
					}
					var sSuccessMessage = "";
					if (aPOIds.length === 1) {
						var sSupplier = oModel.getProperty("/PurchaseOrders('" + aPOIds[0] + "')").SupplierName;
						sSuccessMessage = oResourceBundle.getText(bApprove ? "ymsg.approvalMessageToast" : "ymsg.rejectionMessageToast", [sSupplier]);
					} else {
						sSuccessMessage = oResourceBundle.getText(bApprove ? "ymsg.massApprovalMessageToast" : "ymsg.massRejectionMessageToast");
					}
					MessageToast.show(sSuccessMessage);
				};
			aPOIds = aPurchaseOrders.map(function(oPurchaseOrder) {
				return oPurchaseOrder.POId;
			});
			if (aPOIds.length === 1) {
				oModel.callFunction(sFunction, {
					method: "POST",
					urlParameters: {
						POId: aPOIds[0],
						Note: sApprovalNote
					},
					success: fnOk,
					error: fnOnError
				});
			} else {
				for (i = 0; i < aPOIds.length; i++) {
					oModel.callFunction(sFunction, {
						method: "POST",
						urlParameters: {
							POId: aPOIds[i],
							Note: sApprovalNote
						},
						batchGroupId: "POMassApproval",
						changeSetId: i
					});
				}
				oModel.submitChanges({
					batchGroupId: "POMassApproval",
					success: fnOk,
					error: fnOnError
				});
			}
		}
	};
});