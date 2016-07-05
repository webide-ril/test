sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/core/routing/History",
	"nw/epm/refapps/ext/po/apv/model/formatter"
], function(Controller, UIComponent, History, formatter) {
	"use strict";

	return Controller.extend("nw.epm.refapps.ext.po.apv.controller.BaseController", {
		formatter: formatter,
		getEventBus: function() {
			return this.getOwnerComponent().getEventBus();
		},
		getRouter: function() {
			return UIComponent.getRouterFor(this);
		},
		getModel: function(sName) {
			return this.getView().getModel(sName) || this.getOwnerComponent().getModel(sName);
		},
		setModel: function(oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},
		getResourceBundle: function() {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},
		onNavBack: function() {
			if (History.getInstance().getPreviousHash() !== undefined) {
				history.go(-1);
			} else {
				this.getRouter().navTo("master", {}, true);
			}
		}
	});
});