// In mock mode, the mock server intercepts HTTP calls and provides fake output to the
// client without involving a backend system. But special backend logic, such as that
// performed by function imports, is not automatically known to the mock server. To handle
// such cases, the app needs to define specific mock requests that simulate the backend
// logic using standard HTTP requests (that are again interpreted by the mock server) as
// shown below.

sap.ui.define(["sap/ui/base/Object"], function(Object) {
	"use strict";

	return Object.extend("nw.epm.refapps.ext.po.apv.localService.MockRequests", {
		constructor: function(oMockServer) {
			this._oMockServer = oMockServer;
		},

		getRequests: function() {
			return [this.mockApprovePo(), this.mockRejectPo()];
		},

		mockApprovePo: function() {
			return {
				// This mock request simulates the function import "ApprovePurchaseOrder",
				// which is triggered when the user chooses the "Approve" button.
				// It removes the approved purchase order from the mock data.
				method: "POST",
				path: new RegExp("ApprovePurchaseOrder\\?POId='(.*)'&Note='(.*)'"),
				response: this.deletePo.bind(this)
			};
		},

		mockRejectPo: function() {
			return {
				// This mock request simulates the function import "RejectPurchaseOrder",
				// which is triggered when the user chooses the "Reject" button.
				// It removes the rejected purchase order from the mock data.
				method: "POST",
				path: new RegExp("RejectPurchaseOrder\\?POId='(.*)'&Note='(.*)'"),
				response: this.deletePo.bind(this)
			};
		},

		deletePo: function(oXhr, sPOId) {
			var aPurchaseOrders = this._oMockServer.getEntitySetData("PurchaseOrders"),
				aPurchaseOrderItems = this._oMockServer.getEntitySetData("PurchaseOrderItems"),
				filterPurchaseOrder = function(oPurchaseOrderOrPOItem) {
					return oPurchaseOrderOrPOItem.POId !== sPOId;
				};

			aPurchaseOrders = aPurchaseOrders.filter(filterPurchaseOrder);
			this._oMockServer.setEntitySetData("PurchaseOrders", aPurchaseOrders);
			aPurchaseOrderItems = aPurchaseOrderItems.filter(filterPurchaseOrder);
			this._oMockServer.setEntitySetData("PurchaseOrderItems", aPurchaseOrderItems);

			oXhr.respondJSON(200, {}, JSON.stringify({
				d: {
					results: []
				}
			}));
		}
	});
});