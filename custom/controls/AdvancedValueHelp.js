sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Input",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Bar",
    "sap/m/Title",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/Label",
    "sap/m/Table",
    "sap/m/Column",
    "sap/m/ColumnListItem",
    "sap/m/Text",
    "sap/m/Select",
    "sap/ui/core/Item",
    "sap/ui/table/Table",
    "sap/ui/table/Column",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "./AdvancedValueHelpRenderer"
], function (
    Control,
    Input,
    Dialog,
    Button,
    Bar,
    Title,
    VBox,
    HBox,
    Label,
    ResponsiveTable,
    ResponsiveColumn,
    ColumnListItem,
    Text,
    Select,
    Item,
    UiTable,
    UiTableColumn,
    Filter,
    FilterOperator,
    AdvancedValueHelpRenderer
) {
    "use strict";

    /**
     * Reusable enterprise-ready value help control.
     * Supports JSONModel, OData V2 and OData V4 via dynamic binding path.
     */
    return Control.extend("custom.controls.AdvancedValueHelp", {
        metadata: {
            properties: {
                title: { type: "string", defaultValue: "Select Value" },
                value: { type: "string", defaultValue: "" },
                placeholder: { type: "string", defaultValue: "" },
                keyField: { type: "string", defaultValue: "" },
                descriptionField: { type: "string", defaultValue: "" },
                multiSelect: { type: "boolean", defaultValue: false },
                columns: { type: "object", defaultValue: [] },
                filterFields: { type: "object", defaultValue: [] },
                modelName: { type: "string", defaultValue: "" },
                dataPath: { type: "string", defaultValue: "" },
                tableType: { type: "string", defaultValue: "Responsive" },
                growingThreshold: { type: "int", defaultValue: 30 },
                basicSearchEnabled: { type: "boolean", defaultValue: true },
                basicSearchPlaceholder: { type: "string", defaultValue: "Search" }
            },
            aggregations: {
                _input: { type: "sap.m.Input", multiple: false, visibility: "hidden" }
            },
            events: {
                valueHelpRequest: {},
                selectionChange: {
                    parameters: {
                        selectedKeys: { type: "string[]" },
                        selectedItems: { type: "object[]" }
                    }
                },
                confirm: {
                    parameters: {
                        selectedKeys: { type: "string[]" },
                        selectedItems: { type: "object[]" }
                    }
                },
                cancel: {}
            }
        },

        renderer: AdvancedValueHelpRenderer,

        init: function () {
            this._mFilterControls = Object.create(null);

            const oInput = new Input({
                value: this.getValue(),
                placeholder: this.getPlaceholder(),
                showValueHelp: true,
                valueHelpOnly: false,
                valueHelpRequest: this._onValueHelpRequest.bind(this)
            });

            this.setAggregation("_input", oInput);
        },

        setValue: function (sValue) {
            this.setProperty("value", sValue, true);
            const oInput = this.getAggregation("_input");
            if (oInput) {
                oInput.setValue(sValue || "");
            }
            return this;
        },

        setPlaceholder: function (sPlaceholder) {
            this.setProperty("placeholder", sPlaceholder, true);
            const oInput = this.getAggregation("_input");
            if (oInput) {
                oInput.setPlaceholder(sPlaceholder || "");
            }
            return this;
        },

        _onValueHelpRequest: function () {
            this.fireValueHelpRequest();
            this._openDialog();
        },

        _openDialog: function () {
            if (!this._oDialog) {
                this._oDialog = this._createDialog();
                this.addDependent(this._oDialog);
            }

            this._rebuildContent();
            this._bindTableData();
            this._oDialog.open();
        },

        _createDialog: function () {
            return new Dialog({
                title: this.getTitle(),
                contentWidth: "70%",
                contentHeight: "70%",
                draggable: true,
                resizable: true,
                stretchOnPhone: true,
                customHeader: new Bar({
                    contentMiddle: [new Title({ text: this.getTitle() })]
                }),
                beginButton: new Button({
                    text: "Confirm",
                    type: "Emphasized",
                    press: this._onConfirm.bind(this)
                }),
                endButton: new Button({
                    text: "Cancel",
                    press: this._onCancel.bind(this)
                })
            });
        },

        _rebuildContent: function () {
            this._oDialog.destroyContent();
            this._mFilterControls = Object.create(null);

            const aContent = [];

            if (this.getBasicSearchEnabled()) {
                this._oBasicSearch = new Input({
                    width: "100%",
                    placeholder: this.getBasicSearchPlaceholder(),
                    submit: this._onSearch.bind(this)
                });
                aContent.push(this._oBasicSearch);
            }

            const oFilterBar = this._createFilterArea();
            if (oFilterBar) {
                aContent.push(oFilterBar);
            }

            this._oTable = this._createTable();
            aContent.push(this._oTable);

            aContent.forEach(function (oControl) {
                this._oDialog.addContent(oControl);
            }.bind(this));
        },

        _createFilterArea: function () {
            const aFilterFields = this.getFilterFields() || [];
            if (!aFilterFields.length) {
                return null;
            }

            const oContainer = new VBox({ width: "100%" });
            const oRow = new HBox({ width: "100%", wrap: "Wrap", renderType: "Bare" });

            aFilterFields.forEach(function (oField) {
                const oFieldBox = new VBox({ width: "16rem" }).addStyleClass("sapUiTinyMarginEnd sapUiTinyMarginBottom");
                oFieldBox.addItem(new Label({ text: oField.label || oField.key }));

                const oControl = this._createFilterControl(oField);
                this._mFilterControls[oField.key] = oControl;
                oFieldBox.addItem(oControl);
                oRow.addItem(oFieldBox);
            }.bind(this));

            const oSearchButton = new Button({
                text: "Search",
                type: "Emphasized",
                press: this._onSearch.bind(this)
            }).addStyleClass("sapUiTinyMarginTop");

            oContainer.addItem(oRow);
            oContainer.addItem(oSearchButton);
            return oContainer;
        },

        _createFilterControl: function (oField) {
            if (oField.type === "Select") {
                const oSelect = new Select({ width: "100%" });
                (oField.options || []).forEach(function (oOption) {
                    oSelect.addItem(new Item({
                        key: oOption.key,
                        text: oOption.text
                    }));
                });
                return oSelect;
            }

            return new Input({
                width: "100%",
                submit: this._onSearch.bind(this)
            });
        },

        _createTable: function () {
            return this.getTableType() === "Grid" ? this._createGridTable() : this._createResponsiveTable();
        },

        _createResponsiveTable: function () {
            const aColumns = this.getColumns() || [];
            const oTable = new ResponsiveTable({
                mode: this.getMultiSelect() ? "MultiSelect" : "SingleSelectLeft",
                growing: true,
                growingThreshold: this.getGrowingThreshold(),
                width: "100%"
            });

            aColumns.forEach(function (oColumnConfig) {
                oTable.addColumn(new ResponsiveColumn({
                    header: new Label({ text: oColumnConfig.label || oColumnConfig.key })
                }));
            });

            const aCells = aColumns.map(function (oColumnConfig) {
                const sPath = this._createModelPath(oColumnConfig.key);
                return new Text({ text: "{" + sPath + "}" });
            }.bind(this));

            oTable.bindItems({
                path: this._createDataBindingPath(),
                template: new ColumnListItem({ cells: aCells })
            });

            return oTable;
        },

        _createGridTable: function () {
            const aColumns = this.getColumns() || [];
            const oTable = new UiTable({
                selectionMode: this.getMultiSelect() ? "MultiToggle" : "Single",
                visibleRowCountMode: "Auto",
                minAutoRowCount: 5
            });

            aColumns.forEach(function (oColumnConfig) {
                const sPath = this._createModelPath(oColumnConfig.key);
                oTable.addColumn(new UiTableColumn({
                    label: new Label({ text: oColumnConfig.label || oColumnConfig.key }),
                    template: new Text({ text: "{" + sPath + "}" }),
                    sortProperty: oColumnConfig.key,
                    filterProperty: oColumnConfig.key,
                    autoResizable: true
                }));
            }.bind(this));

            oTable.bindRows({ path: this._createDataBindingPath() });

            return oTable;
        },

        _bindTableData: function () {
            if (!this._oTable) {
                return;
            }

            const sModelName = this.getModelName();
            const oModel = this.getModel(sModelName || undefined);
            if (oModel) {
                this._oTable.setModel(oModel, sModelName || undefined);
            }
        },

        _createDataBindingPath: function () {
            const sModelName = this.getModelName();
            const sDataPath = this.getDataPath();
            return (sModelName ? (sModelName + ">") : "") + sDataPath;
        },

        _createModelPath: function (sProperty) {
            const sModelName = this.getModelName();
            return (sModelName ? (sModelName + ">") : "") + sProperty;
        },

        _onSearch: function () {
            if (!this._oTable) {
                return;
            }

            const aFilters = [];
            const aColumns = this.getColumns() || [];

            Object.keys(this._mFilterControls).forEach(function (sKey) {
                const oControl = this._mFilterControls[sKey];
                const sValue = this._getControlValue(oControl);
                if (sValue) {
                    aFilters.push(new Filter(sKey, FilterOperator.Contains, sValue));
                }
            }.bind(this));

            const sBasicSearch = this._oBasicSearch ? this._oBasicSearch.getValue() : "";
            if (sBasicSearch) {
                const aBasicFilters = aColumns.map(function (oColumnConfig) {
                    return new Filter(oColumnConfig.key, FilterOperator.Contains, sBasicSearch);
                });

                if (aBasicFilters.length) {
                    aFilters.push(new Filter({ filters: aBasicFilters, and: false }));
                }
            }

            const oBinding = this._getTableBinding();
            if (oBinding) {
                oBinding.filter(aFilters);
            }
        },

        _getTableBinding: function () {
            if (!this._oTable) {
                return null;
            }
            if (this.getTableType() === "Grid") {
                return this._oTable.getBinding("rows");
            }
            return this._oTable.getBinding("items");
        },

        _getControlValue: function (oControl) {
            if (!oControl) {
                return "";
            }
            if (oControl.isA("sap.m.Select")) {
                return oControl.getSelectedKey();
            }
            return oControl.getValue();
        },

        _onConfirm: function () {
            const oSelection = this._collectSelection();
            this._applySelectionToInput(oSelection.selectedItems);

            this.fireSelectionChange(oSelection);
            this.fireConfirm(oSelection);
            this._oDialog.close();
        },

        _collectSelection: function () {
            if (this.getTableType() === "Grid") {
                return this._collectGridSelection();
            }
            return this._collectResponsiveSelection();
        },

        _collectResponsiveSelection: function () {
            const aContexts = this._oTable.getSelectedItems().map(function (oItem) {
                return oItem.getBindingContext(this.getModelName() || undefined);
            }.bind(this)).filter(Boolean);

            return this._buildSelectionPayloadFromContexts(aContexts);
        },

        _collectGridSelection: function () {
            const aIndices = this._oTable.getSelectedIndices();
            const aContexts = aIndices.map(function (iIndex) {
                return this._oTable.getContextByIndex(iIndex);
            }.bind(this)).filter(Boolean);

            return this._buildSelectionPayloadFromContexts(aContexts);
        },

        _buildSelectionPayloadFromContexts: function (aContexts) {
            const sKeyField = this.getKeyField();
            const aObjects = aContexts.map(function (oContext) { return oContext.getObject(); });
            const aKeys = aObjects.map(function (oItem) { return oItem[sKeyField]; });

            return {
                selectedKeys: aKeys,
                selectedItems: aObjects
            };
        },

        _applySelectionToInput: function (aSelectedItems) {
            if (!aSelectedItems.length) {
                this.setValue("");
                return;
            }

            const sKey = this.getKeyField();
            const sDescription = this.getDescriptionField();
            const oFirst = aSelectedItems[0];

            const sDisplayValue = sDescription
                ? [oFirst[sKey], oFirst[sDescription]].filter(Boolean).join(" - ")
                : (oFirst[sKey] || "");

            this.setValue(sDisplayValue);
        },

        _onCancel: function () {
            this.fireCancel();
            this._oDialog.close();
        },

        exit: function () {
            if (this._oDialog) {
                this._oDialog.destroy();
                this._oDialog = null;
            }
        }
    });
});
