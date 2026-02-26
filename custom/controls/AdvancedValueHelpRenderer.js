sap.ui.define([], function () {
    "use strict";

    const AdvancedValueHelpRenderer = {
        apiVersion: 2,

        render: function (oRM, oControl) {
            oRM.openStart("div", oControl);
            oRM.class("customAdvancedValueHelp");
            oRM.openEnd();
            oRM.renderControl(oControl.getAggregation("_input"));
            oRM.close("div");
        }
    };

    return AdvancedValueHelpRenderer;
});
