sap.ui.define([
		"sap/ui/core/UIComponent",
		"sap/ui/model/resource/ResourceModel",
		"sap/ui/model/odata/v2/ODataModel",
		"sap/ui/Device",
		"./model/models"
	], function(UIComponent, ResourceModel, ODataModel, Device, models) {
	"use strict";

	return UIComponent.extend("nw.epm.refapps.ext.po.apv.Component", {
		metadata: {
			name: "xtit.shellTitle",
			version: "${project.version}",
			dependencies: {
				libs: ["sap.m", "sap.me", "sap.ushell"],
				components: []
			},
			rootView: "nw.epm.refapps.ext.po.apv.view.App",
			config: {
				resourceBundle: "nw.epm.refapps.ext.po.apv.i18n.i18n",
				titleResource: "xtit.shellTitle",
				icon: "sap-icon://Fiori7/F1373",
				favIcon: "icon/F1373_Approve_Purchase_Orders.ico",
				phone: "icon/launchicon/57_iPhone_Desktop_Launch.png",
				"phone@2": "icon/launchicon/114_iPhone-Retina_Web_Clip.png",
				tablet: "icon/launchicon/72_iPad_Desktop_Launch.png",
				"tablet@2": "icon/launchicon/144_iPad_Retina_Web_Clip.png",
				serviceConfig: {
					name: "EPM_REF_APPS_PO_APV_SRV",
					serviceUrl: "/sap/opu/odata/sap/EPM_REF_APPS_PO_APV_SRV/"
				}
			},
			routing: {
				config: {
					routerClass: "sap.m.routing.Router", // use the router in sap.m library which provides enhanced features
					viewType: "XML",
					viewPath: "nw.epm.refapps.ext.po.apv.view",
					controlId: "fioriContent",
					controlAggregation: "detailPages",
					bypassed: {
						target: ["master", "notFound"]
					}
				},
				routes: [
					{
						pattern: "",
						name: "master",
						target: ["object", "master"]
					},
					{
						pattern: "PurchaseOrder/{POId}",
						name: "PurchaseOrderDetails",
						target: ["master", "object"]
					}
				],
				targets: {
					master: {
						viewName: "S2_PurchaseOrders",
						viewLevel: 1,
						controlAggregation: "masterPages"
					},
					object: {
						viewName: "S3_PurchaseOrderDetails",
						viewLevel: 2
					},
					summary: {
						viewName: "S3_PurchaseOrderSummary",
						viewLevel: 2
					},
					notFound: {
						viewName: "EmptyPage",
						viewLevel: 3
					}
				}
			}
		},

		init: function() {
			var mConfig = this.getMetadata().getConfig();

			// creating and setting the necessary models
			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			// set the FLP model
			this.setModel(models.createFLPModel(), "FLP");

			// create and set the ODataModel
			var oAppModel = models.createODataModel({
				urlParametersForEveryRequest: [
						"sap-server",
						"sap-client",
						"sap-language"
					],
				url: this.getMetadata().getConfig().serviceConfig.serviceUrl,
				config: {
					metadataUrlParams: {
						"sap-documentation": "heading"
					},
					json: true,
					defaultBindingMode: "OneWay",
					useBatch: true,
					defaultCountMode: "Inline",
					loadMetadataAsync: true
				}
			});

			oAppModel.setDeferredBatchGroups(["POMassApproval"]);

			this.setModel(oAppModel);
		
			// set i18n model
			this.setModel(models.createResourceModel(mConfig.resourceBundle), "i18n");

			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);
			// create the views based on the url/hash
			this.getRouter().initialize();
		},

		destroy: function() {
			this.getModel().destroy();
			this.getModel("i18n").destroy();
			this.getModel("FLP").destroy();
			this.getModel("device").destroy();

			// call the base component's destroy function
			UIComponent.prototype.destroy.apply(this, arguments);
		}
	});
});