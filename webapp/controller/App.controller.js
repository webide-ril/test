sap.ui.define([
	"./designMode",
	"sap/ui/model/json/JSONModel"
], function(designMode, JSONModel) {
	"use strict";

	return sap.ui.controller("nw.epm.refapps.ext.po.apv.controller.App", {
		onInit: function() {
			this.getView().addStyleClass(designMode.getCompactCozyClass());

			// The app model enables the views used in this application to access
			// common application information in declarative view definition
			var oAppModel = new JSONModel({
				appControl: this.getAppControl(),
				currentPOId: "",
				selectedPurchaseOrders: [],
				emptyPageText: "",
				busy: true
			});
			oAppModel.setDefaultBindingMode("OneWay");
			this.getAppControl().setModel(oAppModel, "appProperties");
		},

		getAppControl: function() {
			return this.byId("fioriContent");
		}
	});
});