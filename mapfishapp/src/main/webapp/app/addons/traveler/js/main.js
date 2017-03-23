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
            return GeoExt.MapPanel.guess().map
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
     * Method: addDrawControl
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
                emptyText: "Adresse...",
                fieldClass: "fBan",
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
                cls: "actionBtn",
                hidden: isStart,
                handler: function() {
                    //observable.fireEvent("addPoint",observable);
                    travelerAddon.insertFset(panel, window);
                },
                listeners: {
                    "mouseover": function() {
                        if (!this.pressed) {
                            this.setIconClass("addHover");
                        }
                    },
                    "mouseout": function() {
                        if (!this.pressed) {
                            this.setIconClass("addIcon");
                        }
                    }
                }
            }, {
                xtype: "button",
                iconCls: "rmIcon",
                id: rmId,
                hidden: delBtn,
                cls: "actionBtn",
                handler: function(button) {
                    if (fSet) {
                        fSet.destroy();
                        travelerAddon.resizeShadow();
                        // remove associated point
                        //removePoint(layer, gpsId, featureArray);
                        travelerAddon.removeFeature(inputId);
                    }
                },
                listeners: {
                    "mouseover": function() {
                        if (!this.pressed) {
                            this.setIconClass("rmHover");
                        }
                    },
                    "mouseout": function() {
                        if (!this.pressed) {
                            this.setIconClass("rmIcon");
                        }
                    }
                }
            }]
        });

        var comboRef = GEOR.Addons.traveler.referentials(map, options, fSet, featureArray, map, inputId);

        // add all items to field set
        fSet.add(banField);

        if (comboRef) {
            fSet.add(comboRef);
            //fSet.add(comboAtt);
        }


        //create checkitem
        var checkItem = new Ext.form.Checkbox({
            hideLabel: true,
            boxLabel: "Référentiels",
            listeners: {
                "check": function() {
                    if (this.checked) {
                        banField.hide();
                        comboRef.show();
                        //comboAtt.show();
                    } else {
                        banField.show();
                        comboRef.hide();
                        //comboAtt.hide();
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
        if (this.win) {
            this.win.syncShadow()
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
            var idx = panel.items && panel.items.length > 2 ? panel.items.length - 2 : false;
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
        var modeBtn = new Ext.form.CompositeField({
            // first window's panel
            cls: "cpMode",
            items: [{
                xtype: "button",
                height: 35,
                id: "walkBtn",
                width: 35,
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
                        } else {
                            this.setIconClass("walkBtn");
                        }
                    }
                }
            }, {
                xtype: "button",
                iconCls: "car-pressed",
                id: "carBtn",
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
                        } else {
                            this.setIconClass("carBtn");
                        }
                    }
                }
            }]
        });

        // container to display precision about route        
        var detailPan = new Ext.Panel({

        });


        this.panel = new Ext.Panel({
            autoScroll: true,
            id: "wayPointPanel",
            items: [modeBtn, {
                xtype: "fieldset",
                collapsible: true,
                collapsed: true,
                title: "Options",
                cls: "fsOptions",
                items: [{
                    xtype: "compositefield",
                    hideLabel: true,
                    id: "methodRadio",
                    items: [{
                        xtype: "radio",
                        checked: true,
                        hideLabel: true,
                        boxLabel: "Le plus rapide",
                        id: "timeRadio",
                        value: "TIME",
                        name: "method"
                    }, {
                        xtype: "spacer",
                        width: "5"
                    }, {
                        xtype: "radio",
                        hideLabel: true,
                        id: "distanceRadio",
                        name: "method",
                        value: "DISTANCE",
                        boxLabel: "Le plus court"
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
                        boxLabel: "Péages",
                        id: "tollRadio",
                        labelWidth: 20,
                        hideLabel: true,
                        value: "Toll"
                    }, {
                        xtype: "checkbox",
                        boxLabel: "Ponts",
                        id: "bridgeRadio",
                        hideLabel: true,
                        value: "Bridge"
                    }, {
                        xtype: "checkbox",
                        boxLabel: "Tunnels",
                        id: "tunnelRadio",
                        hideLabel: true,
                        value: "Tunnel"
                    }],
                }],
                listeners: {
                    "collapse": function() {
                        if (travelerAddon.win) {
                            travelerAddon.win.syncShadow();
                        }
                    },
                    "expand": function() {
                        if (travelerAddon.win) {
                            travelerAddon.win.syncShadow();
                        }
                    },
                    scope: this
                }
            }],
            listeners: {
                "added": function(panel) {
                    panel.insert(1, travelerAddon.addStep(true, true, "startPoint"));
                    panel.insert(2, travelerAddon.addStep(false, true, "endPoint"));
                }
            }

        });


        // create main window containing free text combo
        this.win = new Ext.Window({
            title: OpenLayers.i18n("traveler.window_title"),
            constrainHeader: true,
            autoHeight: true,
            width: 290,
            autoScroll: true,
            closable: true,
            closeAction: "hide",
            resizable: false,
            collapsible: true,
            items: [this.panel],
            buttonAlign: 'center',
            fbar: [{
                iconCls: "refresh",
                tooltip: "Recommencer",
                cls: "actionBtn"
            }, {
                xtype: "spacer",
                width: "10"
            }, {
                xtype: "spacer",
                width: "10"
            }, {
                iconCls: "detail",
                disabled: true,
                tooltip: "Afficher le détail de l'itinéraire",
                cls: "actionBtn",
                listeners: {
                    "click": function() {
                        if (detailPan.isVisible()) {
                            detailPan.hide();
                        } else {
                            // insert container
                        }
                    }
                }
            }],
            listeners: {
                "hide": function() {
                    // remove all features
                    if (layerAddon) {
                        layerAddon.removeAllFeatures();
                    }
                }
            }
        });


        if (this.target) {
            // create a button to be inserted in toolbar:
            this.components = this.target.insertButton(this.position, {
                xtype: "button",
                tooltip: "tooltip",
                iconCls: "addon-traveler",
                handler: function() {
                    this.win.show();
                },
                scope: this
            });
            this.target.doLayout();
        } else {
            // create a menu item for the "tools" menu:
            this.item = new Ext.menu.CheckItem({
                text: this.getText(record),
                qtip: this.getQtip(record),
                iconCls: "addon-traveler",
                handler: function() {
                    this.win.show();
                },
                scope: this
            });
        }
    },



    /**
     * Method: destroy
     * Called by GEOR_tools when deselecting this addon
     */
    destroy: function() {
        this.win.destroy();

        GEOR.Addons.Base.prototype.destroy.call(this);
    }
});