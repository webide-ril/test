// Utility for formatting values

sap.ui.define([
	"sap/ui/core/format/DateFormat",
	"sap/ui/core/format/NumberFormat",
	"sap/ui/core/Component"
], function(DateFormat, NumberFormat, Component) {
	"use strict";

	function fnGetBundle(oControl) {
		return (oControl.getModel("i18n") || sap.ui.component(Component.getOwnerIdFor(oControl)).getModel("i18n")).getResourceBundle();
	}

	var fnDateAgoFormatter = DateFormat.getDateInstance({
			style: "medium",
			strictParsing: true,
			relative: true
		}),
		fnAmountFormatter = NumberFormat.getCurrencyInstance(),
		fnDeliveryDateFormatter = DateFormat.getDateInstance({
			style: "medium"
		});

	var me = {
		daysAgo: function(dDate) {
			if (!dDate) {
				return "";
			}
			return fnDateAgoFormatter.format(dDate);
		},

		amountWithCurrency: function(fAmount, sCurrency) {
			if (!fAmount || !sCurrency) {
				return "";
			}
			return fnGetBundle(this).getText("xfld.amount", [fnAmountFormatter.format(fAmount), sCurrency]);
		},

		amountWithOutCurrency: function(fAmount) {
			if (!fAmount) {
				return "";
			}
			return fnAmountFormatter.format(fAmount);
		},

		items: function(iItems) {
			if (isNaN(iItems)) {
				return "";
			}
			return (iItems === 1) ? fnGetBundle(this).getText("xfld.item") : fnGetBundle(this).getText("xfld.items", [iItems]);
		},

		deliveryDate: function(dDate) {
			if (!dDate) {
				return "";
			}
			return fnDeliveryDateFormatter.format(dDate);
		},

		orderedBy: function(sOrderedByName) {
			return sOrderedByName ? fnGetBundle(this).getText("xfld.orderedBy", [sOrderedByName]) : "";
		},

		deliveryDateAndLater: function(dDate, bLater) {
			if (!dDate) {
				return "";
			}
			var sDelDate = fnDeliveryDateFormatter.format(dDate);
			return bLater ? fnGetBundle(this).getText("xfld.andLater", [sDelDate]) : sDelDate;
		},

		appDataForTile: function(sTitle) {
			return {
				title: sTitle
			};
		},

		totalSum: function(aPurchaseOrders) {
			var i, fSum = 0;
			for (i = 0; i < aPurchaseOrders.length; i++) {
				fSum = fSum + parseFloat(aPurchaseOrders[i].GrossAmount, 10);
			}
			return me.amountWithOutCurrency(fSum);
		},

		currencyFromList: function(aPurchaseOrders) {
			return aPurchaseOrders.length ? aPurchaseOrders[0].CurrencyCode : "";
		},

		summaryTitle: function(aPurchaseOrders) {
			var iCount = aPurchaseOrders.length;
			return (iCount === 0) ? fnGetBundle(this).getText("xtit.summaryTitleWithoutCount") : fnGetBundle(this).getText("xtit.summaryTitle", [
				iCount
			]);
		},

		masterTitle: function(iCount) {
			return (iCount === 0) ? fnGetBundle(this).getText("xtit.masterTitleWithoutCount") : fnGetBundle(this).getText("xtit.masterTitle", [
				iCount
			]);
		},

		itemListTitle: function(iCount) {
			return (iCount === 0) ? fnGetBundle(this).getText("xtit.itemListTitleWithoutCount") : fnGetBundle(this).getText("xtit.itemListTitle", [
				iCount
			]);
		},

		approvalTitle: function(aPurchaseOrders, bApprove) {
			var iCount = aPurchaseOrders.length;
			if (iCount > 1) {
				return fnGetBundle(this).getText(bApprove ? "xtit.massApprovalTitleForDialog" : "xtit.massRejectionTitleForDialog", [iCount]);
			} else {
				return fnGetBundle(this).getText(bApprove ? "xtit.approvalTitleForDialog" : "xtit.rejectionTitleForDialog");
			}
		},

		approvalText: function(aPurchaseOrders, bApprove) {
			if (aPurchaseOrders.length === 1) {
				return fnGetBundle(this).getText(bApprove ? "xfld.approvalTextWithSupplier" : "xfld.rejectionTextWithSupplier", [aPurchaseOrders[0].SupplierName]);
			} else {
				return fnGetBundle(this).getText(bApprove ? "xfld.approvalTextDifferentSuppliers" : "xfld.rejectionTextDifferentSuppliers");
			}
		}
	};
	return me;
});