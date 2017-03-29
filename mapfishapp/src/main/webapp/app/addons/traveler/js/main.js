Ext.namespace("GEOR.Addons");

GEOR.Addons.traveler = Ext.extend(GEOR.Addons.Base, {

    win: null,
    addressField: null,

    featureArray: new Object(),

    /**
     * Method: map
     * get current map
     *     
     */
    map: function() {
        if (GeoExt.MapPanel.guess().map) {
            return GeoExt.MapPanel.guess().map;
        }
    },


    /**
     * Method: layer
     * create point layer
     *     
     */
    layer: function() {
        var layerAddon;
        var a = this;
        var style = new OpenLayers.StyleMap(this.options.POINT_STYLE);

        if (this.map) {

            // create and add layer to map if not exist
            if (this.map.getLayersByName("traveler_Layer").length == 1) {
                layerAddon = GeoExt.MapPanel.guess().map.getLayersByName("traveler_Layer")[0];
            } else {
                var layerOptions = OpenLayers.Util.applyDefaults(
                    this.layerOptions, {
                        displayInLayerSwitcher: false,
                        projection: a.map.getProjectionObject(),
                        styleMap: style
                    }
                );
                layerAddon = new OpenLayers.Layer.Vector("traveler_Layer", layerOptions);
                this.map.addLayer(layerAddon);
            }
        }
        return layerAddon;
    },

    /**
     * Method: resultLayer
     * create layer to contain route
     *     
     */
    resultLayer: function() {
        var resultLayer;

        var map = this.map;
        var from = new OpenLayers.Projection("EPSG:4326");
        var style = new OpenLayers.StyleMap(this.options.RESULT_STYLE);

        if (map) {
            // create and add layer to map if not exist
            if (map.getLayersByName("traveler_result").length == 1) {
                resultLayer = GeoExt.MapPanel.guess().map.getLayersByName("traveler_result")[0];
            } else {
                var layerOptions = OpenLayers.Util.applyDefaults(
                    this.layerOptions, {
                        displayInLayerSwitcher: false,
                        projection: map.getProjectionObject(),
                        styleMap: style,
                        preFeatureInsert: function(feature) {
                            feature.geometry.transform(from, map.getProjectionObject());
                        }
                    }
                );
                resultLayer = new OpenLayers.Layer.Vector("traveler_result", layerOptions);
                map.addLayer(resultLayer);

            }
        }
        return resultLayer;
    },

    /**
     * Method: drawControl
     * create control to draw point by click if not exist
     *     
     */

    drawControl: function() {

        var controlOptions;
        var addon = this;
        var control = this.map.getControlsBy("id", "traveler_point_ctrl").length == 1 ? this.map.getControlsBy("id", "traveler_point_ctrl")[0] : false;

        // if control not exist create and add it
        if (addon.map && addon.layer() && !control) {
            controlOptions = OpenLayers.Util.applyDefaults(
                this.pointControlOptions, {
                    id: "traveler_point_ctrl"
                }
            );

            control = new OpenLayers.Control.DrawFeature(addon.layer(), OpenLayers.Handler.Point, controlOptions);

            control.events.on({
                "featureadded": function() {
                    var str = "vec_";

                    control.deactivate();

                    var indx = addon.layer().features.length - 1;
                    var feature = addon.layer().features[indx];
                    var lastPid = feature.id;
                    var x = Math.round(feature.geometry.x * 10000) / 10000;
                    var y = Math.round(feature.geometry.y * 10000) / 10000;
                    if (addon.lastFieldUse) {
                        addon.featureArray[addon.lastFieldUse] = lastPid;
                        Ext.getCmp(addon.lastFieldUse).setValue(x + " / " + y);
                    }

                    // fire routing
                    GEOR.Addons.traveler.getRoad(addon);

                },
                scope: this
            });

            // add control
            addon.map.addControl(control);
        }

        // return control
        return control;
    },

    /**
     * Method: removeFeature
     * remove layer feature from table key
     *
     */
    removeFeature: function(id) {
        var arr = this.featureArray;
        var layer = this.layer();
        var resultLayer = this.resultLayer();
        var addon = this;
        var o = Ext.getCmp(id) ? Ext.getCmp(id) : false;
        if (o) {
            o.setValue("");
        }

        if (arr[id] && arr[id] != "") {
            var point = layer.getFeatureById(arr[id]);
            layer.removeFeatures(point);
            arr[id] = "";
            if (layer.features.length > 1) {
                GEOR.Addons.traveler.getRoad(addon);
            } else {
                resultLayer.removeAllFeatures();
            }

        }
    },

    /**
     * Method: onBanSelect
     * get BAN result to feature
     *
     */
    onBanSelect: function(combo, record) {
        var geom, toCoordX, toCoordY, from, to, geom, fromCoordX, fromCoordY, point, feature;

        if (this.layer()) {
            var vecId = this.featureArray[combo.id] ? this.featureArray[combo.id] : false;

            if (vecId && vecId != "" && combo.id) {
                this.removeFeature(combo.id);
            }


            from = new OpenLayers.Projection("EPSG:4326"), // default GeoJSON SRS return by the service 
                to = this.map.getProjectionObject();

            //get coordinates from GeoJson
            fromCoordX = record.json.geometry.coordinates[0];
            fromCoordY = record.json.geometry.coordinates[1];

            // get json geometry transform to map projection
            geom = new OpenLayers.Geometry.Point(fromCoordX, fromCoordY).transform(from, to);

            // create point from from transform geometry
            point = new OpenLayers.Geometry.Point(geom.x, geom.y);
            feature = new OpenLayers.Feature.Vector(point);

            // update table
            this.featureArray[combo.id] = feature.id;

            // add point feature to layer and zoom on    
            this.layer().addFeatures(feature);
        }
    },

    /**
     * Method: addStep
     *Add new step on route
     *
     * Parameters:
     * isStart - {boolean} true or false to set start point
     * delBtn  - {boolean} true or false to display cross icon
     */

    addStep: function(isStart, delBtn, idFset) {

        var addStr = "add_";
        var rmStr = "rm_";
        var gpsStr = "gps_";
        var inputStr = "field_";

        var travelerAddon = this;
        var layer = this.layer();
        var featureArray = this.featureArray;

        if (this.win) {
            var window = this.win;
        }

        if (this.panel) {
            var panel = this.panel;
        }

        var map = this.map;

        var options = this.options;

        var banStore = new Ext.data.JsonStore({
            proxy: new Ext.data.HttpProxy({
                url: "https://api-adresse.data.gouv.fr/search/?", // set service URL in config.json file, more informations in README
                method: 'GET',
                autoLoad: true
            }),
            root: 'features',
            fields: [{
                    name: 'typeGeometry',
                    convert: function(v, rec) {
                        return rec.geometry.type
                    }
                },
                {
                    name: 'coordinates',
                    convert: function(v, rec) {
                        return rec.geometry.coordinates
                    }
                },
                {
                    name: 'id',
                    convert: function(v, rec) {
                        return rec.properties.id
                    }
                },
                {
                    name: 'label',
                    convert: function(v, rec) {
                        return rec.properties.label
                    }
                }
            ],
            totalProperty: 'limit',
            listeners: {
                "beforeload": function(q) {
                    banStore.baseParams.q = banStore.baseParams["query"];
                    banStore.baseParams.limit = 5; // number of result is default set to 5, change it in config.json file, more informations in README
                    delete banStore.baseParams["query"];
                }
            }
        });

        // create element to contain waypoint's fields
        var fSet = new Ext.form.FieldSet({
            autoWidht: true,
            cls: "fsStep",
            id: idFset
        });

        // create ID from fSet
        var addId = addStr + fSet.id;
        var gpsId = gpsStr + fSet.id;
        var rmId = rmStr + fSet.id;
        var inputId = inputStr + fSet.id;

        function removePoint(layer, id, arr) {
            // delete point
            if (arr[id] && arr[id] != "") {
                var point = layer.getFeatureById(arr[id]);
                layer.removeFeatures(point);
            }
        }

        // create field and buttons
        var banField = new Ext.form.CompositeField({
            hideLabel: true,
            anchor: "100%",
            items: [{
                xtype: "combo",
                id: inputId,
                anchor: 200,
                emptyText: OpenLayers.i18n("traveler.ban.emptytext"),
                fieldClass: "fBan",
                tooltip: OpenLayers.i18n("traveler.ban.tooltip"),
                hideLabel: true,
                hideTrigger: true,
                store: banStore,
                displayField: 'label',
                hideTrigger: true,
                pageSize: 0,
                minChars: 5,
                listeners: {
                    "select": this.onBanSelect,
                    scope: this
                }
            }, {
                xtype: "button",
                iconCls: "gpsIcon",
                id: gpsId,
                tooltip: OpenLayers.i18n("traveler.drawpoint.tooltip"),
                cls: "actionBtn",
                handler: function(button) {
                    var idBtn = button.id;
                    var pointControl = travelerAddon.drawControl();
                    // add point by click
                    if (pointControl && map) {
                        if (!pointControl.active) {
                            // active control
                            pointControl.activate();
                            // use to change value display in field
                            travelerAddon.lastFieldUse = inputId;
                            travelerAddon.removeFeature(inputId);
                        } else {
                            pointControl.deactivate();
                        }
                    }
                }
            }, {
                xtype: "button",
                iconCls: "addIcon",
                id: addId,
                tooltip: OpenLayers.i18n("traveler.addpoint.tooltip"),
                cls: "actionBtn",
                hidden: isStart,
                handler: function() {
                    if (Ext.getCmp("wayPointPanel")) {
                        var panel = Ext.getCmp("wayPointPanel");
                        travelerAddon.insertFset(panel, window);
                    }
                }
            }, {
                xtype: "button",
                iconCls: "rmIcon",
                id: rmId,
                tooltip: OpenLayers.i18n("traveler.removepoint.tooltip"),
                hidden: delBtn,
                cls: "actionBtn",
                handler: function(button) {
                    if (fSet) {
                        fSet.destroy();
                        travelerAddon.resizeShadow();
                        // remove associated point if exist
                        travelerAddon.removeFeature(inputId);
                        if (travelerAddon.drawControl().active) {
                            travelerAddon.drawControl().deactivate();
                        }
                    }
                }
            }]
        });

        var comboRef = GEOR.Addons.traveler.referentials(travelerAddon, fSet, inputId);

        // if no warehouse is set to find layer, deactive checkBox
        var cbDisplay = false;


        // add all items to field set
        fSet.add(banField);

        if (comboRef) {
            fSet.add(comboRef);
            //fSet.add(comboAtt);
        }

        if (comboRef.getStore() && (!comboRef.getStore().url || comboRef.getStore().url == "")) {
            cbDisplay = true;
        }

        //create checkitem
        var checkItem = new Ext.form.Checkbox({
            hideLabel: true,
            hidden: cbDisplay,
            boxLabel: "Référentiels",
            listeners: {
                "check": function() {
                    if (this.checked) {
                        banField.hide();
                        comboRef.show();
                    } else {
                        banField.show();
                        comboRef.hide();
                    }
                }
            }
        });

        // insert checkbox to select data type
        fSet.insert(0, checkItem);

        return fSet;
    },

    /**
     * Method: resizeShadow
     *
     * Parameters:
     * panel - {Ext.form.Panel} panel to contain field and search options
     * window - {Ext.form.Window} main window use to calculate route
     * method - {function} addon method to add new fieldSet
     */

    resizeShadow: function() {
        if (this.win()) {
            this.win().syncShadow()
        }
    },

    /**
     * Method: resetWindow
     * refresh window when user click on refresh button
     */

    refresh: function() {
        if (Ext.getCmp("travWindow")) {
            Ext.getCmp("travWindow").close();
            if (this.win) {
                this.win();
            }
            if (Ext.getCmp("travWindow")) {
                return Ext.getCmp("travWindow").show();
            }
        }
    },


    /**
     * Method: initWindow
     * Generate window to set params and way point
     */

    win: function() {
        var addon = this;

        if (Ext.getCmp("travWindow")) {
            return Ext.getCmp("travWindow");
        } else {
            return new Ext.Window({
                title: OpenLayers.i18n("traveler.window_title"),
                constrainHeader: true,
                autoHeight: true,
                width: 290,
                id: "travWindow",
                autoScroll: true,
                closable: true,
                closeAction: "hide",
                resizable: false,
                collapsible: true,
                items: [addPanel()],
                buttonAlign: 'center',
                fbar: [{
                    iconCls: "refresh",
                    tooltip: OpenLayers.i18n("traveler.refresh.tooltip"),
                    id: "trav_refresh",
                    cls: "actionBtn",
                    handler: function() {
                        addon.refresh();
                    }
                }, {
                    iconCls: "navIcon",
                    cls: "actionBtn",
                    hidden:true,
                    id:"trav_nav",
                    tooltip: OpenLayers.i18n("traveler.print.tooltip"),
                    handler:function(){
                    	if(GEOR.Addons.traveler.navInfos){
                    		// call pdf -> see getDocument method in photos obliques
                    	}
                    }
                }],
                listeners: {
                    "hide": function() {
                        // remove all features
                        if (addon.layer()) {
                            addon.layer().removeAllFeatures();
                        }
                        if (addon.resultLayer()) {
                            addon.resultLayer().removeAllFeatures();
                        }
                    }
                }
            });
        }
    },

    /**
     * Method: insertFset
     *
     * Parameters:
     * panel - {Ext.form.Panel} panel to contain field and search options
     * window - {Ext.form.Window} main window use to calculate route
     * method - {function} addon method to add new fieldSet
     */
    insertFset: function(panel, window) {

        var addon = this;

        if (panel) {
            var idx = panel.items && panel.items.length > 2 ? panel.items.length - 4 : false;
            if (idx) {
                // add cross button to delete step
                panel.insert(idx, addon.addStep(true, false));
                // force refresh panel
                panel.doLayout();
                this.resizeShadow();
            }
        }
    },

    /**
     * Method: init
     *
     * Parameters:
     * record - {Ext.data.record} a record with the addon parameters
     */
    init: function(record) {
        // use to call addon's scope
        var travelerAddon = this;

        // do not load addon if user is not connect to map viewer
        if (GEOR.config.ANONYMOUS) {
            return Ext.Msg.alert(
                OpenLayers.i18n("traveler.msg.noright"),
                travelerAddon.options.RIGHT_MSG);
        }

        // get map viewer
        var map = this.map;

        // create wgs84 projection
        var from = new OpenLayers.Projection("EPSG:4326")

        // get map projection    	
        var to = this.map.getProjectionObject();

        // get addon layer use to display points
        var layerAddon = this.layer();

        // get table of key value to find step or points 
        var featureArray = this.featureArray;

        // use to call addon's scope
        var travelerAddon = this;

        // create control to draw point
        this.drawControl();

        // create buttons to select type of transport
        var modeBtn = function() {
            return new Ext.form.CompositeField({
                // first window's panel
                cls: "cpMode",
                items: [{
                    xtype: "button",
                    height: 35,
                    id: "walkBtn",
                    width: 35,
                    tooltip: OpenLayers.i18n("traveler.method.walk.tooltip"),
                    enableToggle: true,
                    toggleGroup: "modeBtn",
                    iconCls: "walkBtn",
                    cls: "walkStyle",
                    listeners: {
                        "mouseover": function() {
                            if (!this.pressed) {
                                this.setIconClass("walk-over");
                            }
                        },
                        "mouseout": function() {
                            if (!this.pressed) {
                                this.setIconClass("walkBtn");
                            }
                        },
                        "toggle": function() {
                            if (this.pressed) {
                                this.setIconClass("walk-pressed");
                                GEOR.Addons.traveler.getRoad(travelerAddon);
                            } else {
                                this.setIconClass("walkBtn");
                            }
                        }
                    }
                }, {
                    xtype: "button",
                    iconCls: "car-pressed",
                    id: "carBtn",
                    tooltip: OpenLayers.i18n("traveler.method.car.tooltip"),
                    enableToggle: true,
                    pressed: true,
                    height: 35,
                    toggleGroup: "modeBtn",
                    width: 35,
                    cls: "carStyle",
                    listeners: {
                        "mouseover": function() {
                            if (!this.pressed) {
                                this.setIconClass("car-over");
                            }
                        },
                        "mouseout": function() {
                            if (!this.pressed) {
                                this.setIconClass("carBtn");
                            }
                        },
                        "toggle": function() {
                            if (this.pressed) {
                                this.setIconClass("car-pressed");
                                GEOR.Addons.traveler.getRoad(travelerAddon);
                            } else {
                                this.setIconClass("carBtn");
                            }
                        }
                    }
                }]
            });
        };

        addPanel = function() {
            return new Ext.Panel({
                autoScroll: true,
                hidden: false,
                id: "wayPointPanel",
                items: [modeBtn(), {
                    xtype: "fieldset",
                    collapsible: true,
                    collapsed: true,
                    title: OpenLayers.i18n("traveler.options.title"),
                    cls: "fsOptions",
                    items: [{
                        xtype: "compositefield",
                        hideLabel: true,
                        id: "methodRadio",
                        items: [{
                            xtype: "radio",
                            checked: true,
                            hideLabel: true,
                            boxLabel: OpenLayers.i18n("traveler.options.fast"),
                            id: "timeRadio",
                            value: "TIME",
                            name: "method",
                            listeners: {
                                check: function(c) {
                                    GEOR.Addons.traveler.getRoad(travelerAddon);
                                },
                                scope: this
                            }
                        }, {
                            xtype: "spacer",
                            width: "5"
                        }, {
                            xtype: "radio",
                            hideLabel: true,
                            id: "distanceRadio",
                            name: "method",
                            value: "DISTANCE",
                            boxLabel: OpenLayers.i18n("traveler.options.distance"),
                            listeners: {
                                check: function(c) {
                                    GEOR.Addons.traveler.getRoad(travelerAddon);
                                },
                                scope: this
                            }
                        }, {
                            xtype: "spacer",
                            height: "25"
                        }]
                    }, {
                        xtype: "compositefield",
                        id: "excludeCheck",
                        hideLabel: true,
                        items: [{
                            xtype: "checkbox",
                            tooltip: OpenLayers.i18n("traveler.options.toll.tooltip"),
                            boxLabel: OpenLayers.i18n("traveler.options.checkbox.toll"),
                            id: "tollRadio",
                            labelWidth: 20,
                            hideLabel: true,
                            value: "Toll",
                            listeners: {
                                check: function(c) {
                                    GEOR.Addons.traveler.getRoad(travelerAddon);
                                },
                                scope: this
                            }
                        }, {
                            xtype: "checkbox",
                            boxLabel: OpenLayers.i18n("traveler.options.checkbox.bridge"),
                            tooltip: OpenLayers.i18n("traveler.options.bridge.tooltip"),
                            id: "bridgeRadio",
                            hideLabel: true,
                            value: "Bridge",
                            listeners: {
                                check: function(c) {
                                    GEOR.Addons.traveler.getRoad(travelerAddon);
                                },
                                scope: this
                            }
                        }, {
                            xtype: "checkbox",
                            boxLabel: OpenLayers.i18n("traveler.options.checkbox.tunels"),
                            tooltip: OpenLayers.i18n("traveler.options.tunnels.tooltip"),
                            id: "tunnelRadio",
                            hideLabel: true,
                            value: "Tunnel",
                            listeners: {
                                check: function(c) {
                                    GEOR.Addons.traveler.getRoad(travelerAddon);
                                },
                                scope: this
                            }
                        }]
                    }],
                    listeners: {
                        "collapse": function() {
                            if (travelerAddon.win()) {
                                travelerAddon.win().syncShadow();
                            }
                        },
                        "expand": function() {
                            if (travelerAddon.win()) {
                                travelerAddon.win().syncShadow();
                            }
                        }
                    }
                }, {
                    xtype: "spacer",
                    height: "10"
                }, {
                    xtype: "fieldset",
                    title: OpenLayers.i18n("traveler.result.title"),
                    hidden: true,
                    id: "trav_result",
                    collapsible: true,
                    collapsed: true,
                    cls: "fsInfo",
                    items: [{
                        xtype: "textfield",
                        id: "trav_dist",
                        width: 60,
                        fieldLabel: OpenLayers.i18n("traveler.result.distance"),
                        readOnly: true,
                        style: {
                            borderWidth: "0px"
                        },
                        labelStyle: 'font-size:11px;'
                    }, {
                        xtype: "textfield",
                        width: 60,
                        id: "trav_time",
                        fieldLabel: OpenLayers.i18n("traveler.result.time"),
                        readOnly: true,
                        style: {
                            borderWidth: "0px"
                        },
                        labelStyle: 'font-size:11px;'
                    }],
                    listeners: {
                        "collapse": function() {
                            if (travelerAddon.win()) {
                                travelerAddon.win().syncShadow();
                            }
                        },
                        "expand": function() {
                            if (travelerAddon.win()) {
                                travelerAddon.win().syncShadow();
                            }
                        },
                        "show": function(f) {
                            if (f.collapsed) {
                                f.expand();
                            }
                        }
                    }
                }],
                listeners: {
                    "added": function(panel) {
                        panel.insert(1, travelerAddon.addStep(true, true, "startPoint"));
                        panel.insert(2, travelerAddon.addStep(false, true, "endPoint"));
                    }
                }
            });
        };

        if (this.target) {
            // create a button to be inserted in toolbar:
            this.components = this.target.insertButton(this.position, {
                xtype: "button",
                iconCls: "addon-traveler",
                handler: this._onCheckchange,
                scope: this
            });
            this.target.doLayout();
        } else {
            // create a menu item for the "tools" menu:
            this.item = new Ext.menu.CheckItem({
                text: this.getText(record),
                qtip: this.getQtip(record),
                iconCls: "addon-traveler",
                handler: this._onCheckchange,
                scope: this
            });
        }
    },

    /**
     * Method: _onCheckchange Callback on checkbox state changed
     * when called from toolbar button, checked is an mouseevent object
     * when called from tools menu checkitem or manually from openToolbarOnLoad, checked is a boolean
     */

    _onCheckchange: function() {
        if (this.win().isVisible()) {
            this.win().hide();
        } else {
            this.win().show();
        }
    },

    /**
     * Method: destroy
     * Called by GEOR_tools when deselecting this addon
     */
    destroy: function() {
        if (this.win()) {
            this.win().destroy();
        }

        if (this.layer()) {
            this.layer().destroy();
        }

        if (this.resultLayer()) {
            this.resultLayer().destroy();
        }

        GEOR.Addons.Base.prototype.destroy.call(this);
    }
});