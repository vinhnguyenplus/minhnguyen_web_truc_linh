sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("demo.controller.Example", {
        onInit: function () {
            const oConfigModel = new JSONModel("examples/valuehelp/ValueHelpConfig.json");
            this.getView().setModel(oConfigModel, "vhConfig");

            const oCustomerModel = new JSONModel({
                Customers: [
                    { CustomerID: "C-1000", CustomerName: "ABC Retail", Country: "DE", Status: "Active" },
                    { CustomerID: "C-1001", CustomerName: "Sunrise Ltd", Country: "US", Status: "Active" },
                    { CustomerID: "C-1002", CustomerName: "Blue Ocean", Country: "VN", Status: "Inactive" }
                ]
            });
            this.getView().setModel(oCustomerModel, "customers");

            this.getView().setModel(new JSONModel({
                selectedCustomerKey: ""
            }), "view");
        },

        onValueHelpSelection: function (oEvent) {
            const aKeys = oEvent.getParameter("selectedKeys");
            const aItems = oEvent.getParameter("selectedItems");

            this.getView().getModel("view").setProperty("/selectedCustomerKey", aKeys[0] || "");
            // Enterprise usage: consume selected items payload for dependent fields.
            // aItems[0] includes full selected object.
            void aItems;
        }
    });
});
