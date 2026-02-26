sap.ui.define([
    "sap/ui/mdc/ValueHelp",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Bar",
    "sap/m/Title",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/Label",
    "sap/m/Input",
    "sap/m/Select",
    "sap/ui/core/Item",
    "sap/m/Table",
    "sap/m/Column",
    "sap/m/ColumnListItem",
    "sap/m/Text",
    "sap/ui/table/Table",
    "sap/ui/table/Column",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (
    ValueHelp,
    Dialog,
    Button,
    Bar,
    Title,
    VBox,
    HBox,
    Label,
    Input,
    Select,
    Item,
    ResponsiveTable,
    ResponsiveColumn,
    ColumnListItem,
    Text,
    GridTable,
    GridColumn,
    Filter,
    FilterOperator
) {
    "use strict";

    /**
     * Advanced reusable ValueHelp that directly inherits from sap.ui.mdc.ValueHelp.
     * It adds a configurable sap.m.Dialog content layer for freestyle applications.
     */
    return ValueHelp.extend("custom.controls.AdvancedValueHelp", {
        metadata: {
            properties: {
                title: { type: "string", defaultValue: "Select Value" },
                keyField: { type: "string", defaultValue: "" },
                descriptionField: { type: "string", defaultValue: "" },
                multiSelect: { type: "boolean", defaultValue: false },
                columns: { type: "object", defaultValue: [] },
                filterFields: { type: "object", defaultValue: [] },
                modelName: { type: "string", defaultValue: "" },
                dataPath: { type: "string", defaultValue: "" },
                tableType: { type: "string", defaultValue: "Responsive" },
                basicSearchEnabled: { type: "boolean", defaultValue: true },
                basicSearchPlaceholder: { type: "string", defaultValue: "Search" },
                growingThreshold: { type: "int", defaultValue: 30 }
            },
            events: {
                selectionChange: {
                    parameters: {
                        selectedKeys: { type: "string[]" },
                        selectedItems: { type: "object[]" }
                    }
                }
            }
        },

        init: function () {
            if (ValueHelp.prototype.init) {
                ValueHelp.prototype.init.apply(this, arguments);
            }
            this._mFilterControls = Object.create(null);
        },

        /**
         * Opens the custom value-help dialog.
         * Keep public method so caller can trigger from Input.valueHelpRequest.
         */
        open: function () {
            this._ensureDialog();
            this._buildDialogContent();
            this._bindTableModel();
            this._oDialog.open();
        },

        _ensureDialog: function () {
            if (this._oDialog) {
                this._oDialog.setTitle(this.getTitle());
                return;
            }

            this._oDialog = new Dialog({
                title: this.getTitle(),
                contentWidth: "72%",
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
                    press: function () { this._oDialog.close(); }.bind(this)
                })
            });

            this.addDependent(this._oDialog);
        },

        _buildDialogContent: function () {
            this._oDialog.destroyContent();
            this._mFilterControls = Object.create(null);

            const oWrapper = new VBox({ width: "100%" });

            if (this.getBasicSearchEnabled()) {
                this._oBasicSearch = new Input({
                    width: "100%",
                    placeholder: this.getBasicSearchPlaceholder(),
                    submit: this._onSearch.bind(this)
                });
                oWrapper.addItem(this._oBasicSearch);
            }

            const oFilters = this._createFilterBarArea();
            if (oFilters) {
                oWrapper.addItem(oFilters);
            }

            this._oTable = this.getTableType() === "Grid" ? this._createGridTable() : this._createResponsiveTable();
            oWrapper.addItem(this._oTable);
            this._oDialog.addContent(oWrapper);
        },

        _createFilterBarArea: function () {
            const aFilterFields = this.getFilterFields() || [];
            if (!aFilterFields.length) {
                return null;
            }

            const oContainer = new VBox({ width: "100%" }).addStyleClass("sapUiSmallMarginTop");
            const oRow = new HBox({ width: "100%", wrap: "Wrap" });

            aFilterFields.forEach(function (oField) {
                const oFieldBox = new VBox({ width: "16rem" }).addStyleClass("sapUiTinyMarginEnd sapUiTinyMarginBottom");
                oFieldBox.addItem(new Label({ text: oField.label || oField.key }));

                const oControl = oField.type === "Select" ? this._createSelectFilter(oField) : this._createInputFilter();
                this._mFilterControls[oField.key] = oControl;
                oFieldBox.addItem(oControl);
                oRow.addItem(oFieldBox);
            }.bind(this));

            oContainer.addItem(oRow);
            oContainer.addItem(new Button({
                text: "Search",
                type: "Emphasized",
                press: this._onSearch.bind(this)
            }));

            return oContainer;
        },

        _createInputFilter: function () {
            return new Input({ width: "100%", submit: this._onSearch.bind(this) });
        },

        _createSelectFilter: function (oField) {
            const oSelect = new Select({ width: "100%" });
            (oField.options || []).forEach(function (oOption) {
                oSelect.addItem(new Item({ key: oOption.key, text: oOption.text }));
            });
            return oSelect;
        },

        _createResponsiveTable: function () {
            const aColumns = this.getColumns() || [];
            const oTable = new ResponsiveTable({
                mode: this.getMultiSelect() ? "MultiSelect" : "SingleSelectLeft",
                growing: true,
                growingThreshold: this.getGrowingThreshold(),
                width: "100%"
            });

            aColumns.forEach(function (oCol) {
                oTable.addColumn(new ResponsiveColumn({
                    header: new Label({ text: oCol.label || oCol.key })
                }));
            });

            const aCells = aColumns.map(function (oCol) {
                return new Text({ text: "{" + this._modelPath(oCol.key) + "}" });
            }.bind(this));

            oTable.bindItems({
                path: this._dataPath(),
                template: new ColumnListItem({ cells: aCells })
            });

            return oTable;
        },

        _createGridTable: function () {
            const aColumns = this.getColumns() || [];
            const oTable = new GridTable({
                selectionMode: this.getMultiSelect() ? "MultiToggle" : "Single",
                visibleRowCountMode: "Auto",
                minAutoRowCount: 5
            });

            aColumns.forEach(function (oCol) {
                oTable.addColumn(new GridColumn({
                    label: new Label({ text: oCol.label || oCol.key }),
                    template: new Text({ text: "{" + this._modelPath(oCol.key) + "}" }),
                    sortProperty: oCol.key,
                    filterProperty: oCol.key,
                    autoResizable: true
                }));
            }.bind(this));

            oTable.bindRows({ path: this._dataPath() });
            return oTable;
        },

        _bindTableModel: function () {
            const sModelName = this.getModelName();
            const oModel = this.getModel(sModelName || undefined);
            if (oModel && this._oTable) {
                this._oTable.setModel(oModel, sModelName || undefined);
            }
        },

        _onSearch: function () {
            const aFilters = [];
            const aColumns = this.getColumns() || [];

            Object.keys(this._mFilterControls).forEach(function (sKey) {
                const oControl = this._mFilterControls[sKey];
                const sValue = oControl.isA("sap.m.Select") ? oControl.getSelectedKey() : oControl.getValue();
                if (sValue) {
                    aFilters.push(new Filter(sKey, FilterOperator.Contains, sValue));
                }
            }.bind(this));

            const sBasic = this._oBasicSearch ? this._oBasicSearch.getValue() : "";
            if (sBasic) {
                const aOr = aColumns.map(function (oCol) {
                    return new Filter(oCol.key, FilterOperator.Contains, sBasic);
                });
                if (aOr.length) {
                    aFilters.push(new Filter({ filters: aOr, and: false }));
                }
            }

            const oBinding = this.getTableType() === "Grid" ? this._oTable.getBinding("rows") : this._oTable.getBinding("items");
            if (oBinding) {
                oBinding.filter(aFilters);
            }
        },

        _onConfirm: function () {
            const oPayload = this.getTableType() === "Grid" ? this._gridPayload() : this._responsivePayload();
            this.fireSelectionChange(oPayload);
            this._oDialog.close();
        },

        _responsivePayload: function () {
            const aContexts = this._oTable.getSelectedItems().map(function (oItem) {
                return oItem.getBindingContext(this.getModelName() || undefined);
            }.bind(this)).filter(Boolean);
            return this._payloadFromContexts(aContexts);
        },

        _gridPayload: function () {
            const aContexts = this._oTable.getSelectedIndices().map(function (iIdx) {
                return this._oTable.getContextByIndex(iIdx);
            }.bind(this)).filter(Boolean);
            return this._payloadFromContexts(aContexts);
        },

        _payloadFromContexts: function (aContexts) {
            const sKeyField = this.getKeyField();
            const aItems = aContexts.map(function (oCtx) { return oCtx.getObject(); });
            const aKeys = aItems.map(function (oObj) { return oObj[sKeyField]; });
            return { selectedKeys: aKeys, selectedItems: aItems };
        },

        _dataPath: function () {
            const sModelName = this.getModelName();
            const sPath = this.getDataPath();
            return (sModelName ? (sModelName + ">") : "") + sPath;
        },

        _modelPath: function (sProperty) {
            const sModelName = this.getModelName();
            return (sModelName ? (sModelName + ">") : "") + sProperty;
        },

        exit: function () {
            if (this._oDialog) {
                this._oDialog.destroy();
                this._oDialog = null;
            }
        }
    });
});
