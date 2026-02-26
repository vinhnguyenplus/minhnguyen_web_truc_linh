sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("demo.controller.Example", {
        onInit: function () {
            const oConfigModel = new JSONModel("examples/valuehelp/ValueHelpConfig.json");
            this.getView().setModel(oConfigModel, "vhConfig");

            this.getView().setModel(new JSONModel({
                Customers: [
                    { CustomerID: "C-1000", CustomerName: "ABC Retail", Country: "DE", Status: "Active" },
                    { CustomerID: "C-1001", CustomerName: "Sunrise Ltd", Country: "US", Status: "Active" },
                    { CustomerID: "C-1002", CustomerName: "Blue Ocean", Country: "VN", Status: "Inactive" }
                ]
            }), "customers");

            this.getView().setModel(new JSONModel({
                selectedCustomerKey: "",
                selectedCustomerDisplay: ""
            }), "view");
        },

        onOpenCustomerVH: function () {
            this.byId("vhCustomer").open();
        },

        onValueHelpSelection: function (oEvent) {
            const aKeys = oEvent.getParameter("selectedKeys") || [];
            const aItems = oEvent.getParameter("selectedItems") || [];
            const oViewModel = this.getView().getModel("view");

            oViewModel.setProperty("/selectedCustomerKey", aKeys[0] || "");

            if (aItems[0]) {
                oViewModel.setProperty("/selectedCustomerDisplay", [aItems[0].CustomerID, aItems[0].CustomerName].join(" - "));
            } else {
                oViewModel.setProperty("/selectedCustomerDisplay", "");
            }
        }
    });
});
