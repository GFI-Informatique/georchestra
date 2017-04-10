Ext.namespace("GEOR");

GEOR.Addons.TravelTools.banCombo = function(map, waypointLayer, id) {
    // TODO : set service URL in config.json file, more informations in README
    // create store
    var banStore = new Ext.data.JsonStore({
        proxy: new Ext.data.HttpProxy({
            url: "https://api-adresse.data.gouv.fr/search/?",
            method: "GET",
            autoLoad: true
        }),
        root: "features",
        fields: [{
                name: "typeGeometry",
                convert: function(v,rec) {
                    return rec.geometry.type;
                }
            },
            {
                name: "coordinates",
                convert: function(v,rec) {
                    return rec.geometry.coordinates;
                }
            },
            {
                name: "id",
                convert: function(v,rec) {
                    return rec.properties.id;
                }
            },
            {
                name: "label",
                convert: function(v,rec) {
                    return rec.properties.label;
                }
            }
        ],
        totalProperty: "limit",
        listeners: {
            "beforeload": function(q) {
                banStore.baseParams.q = banStore.baseParams["query"];
                banStore.baseParams.limit = 5; // number of result is default set to 5, change it in config.json file, more informations in README
                delete banStore.baseParams["query"];
            }
        }
    });
    // create comboBox
    var banCombo = new Ext.form.ComboBox({
        anchor: 200,
        fieldClass: "fBan",
        id: id,
        emptyText: OpenLayers.i18n("ban.emptytext"),
        tooltip: OpenLayers.i18n("ban.tooltip"),
        hideLabel: true,
        hideTrigger: true,
        store: banStore,
        displayField: "label",
        hideTrigger: true,
        pageSize: 0,
        minChars: 5,
        listeners: {
            "select": function(combo, record) {
                if (addon.wpLayer && addon.map) {
                    var lon = record.json.geometry.coordinate[0];
                    var lat = record.json.geometry.coordinate[1];
                    var geom = new OpenLayers.Geometry.Point(lon, lat).transform(epsg4326, map.getProjection());
                    var point = new OpenLayers.Geometry.Point(geom.x, geom.y);
                    var feature = new OpenLayers.Feature.Vector(point);
                    wpLayer.addFeatures(feature);
                }
            },
            scope: this
        }
    });
    return banCombo;
}

GEOR.Addons.Traveltools.referentials = function(addon, fieldSet, inputId) {
    /*
     * Property: comboPanel
     * {Ext.Panel} the panel with the card layout
     * It can hold as many formPanels as reference layers
     */
    var comboPanel = null;

    /*
     * Property: geometryName
     * {String} the selected layer geometry name
     */
    var geometryName = null;

    /**
     * Property: tr
     * {Function} an alias to OpenLayers.i18n
     */
    var tr = null;

    /*
     * Method: onLayerSelected
     * Callback executed on layer selected
     */
    var onLayerSelected = function(combo, record, index) {
        var idx = record.get('name');
        var pos = fieldSet.items.length;
        GEOR.waiter.show();
        var protocol = record.get('layer').protocol;
        if (fieldSet) {
            // check if panel already exists
            if (addon.featureArray[combo.id]) {
                Ext.getCmp(addon.featureArray[combo.id]).destroy();
            }
            var attStore = GEOR.ows.WFSDescribeFeatureType({
                owsURL: protocol.url,
                typeName: idx
            }, {
                success: function() {
                    var cb = GEOR.Addons.TravelTools.cbAttribute(record, attStore, fieldSet, inputId, combo, addon);
                    fieldSet.insert(pos, cb);
                    if (Ext.getCmp("wayPointPanel")) {
                        Ext.getCmp("wayPointPanel").doLayout();
                    }
                },
                failure: function() {
                    GEOR.waiter.hide();
                },
                scope: this
            });
        }
    };

    /*
     * Method: createLayerCombo
     * Creates the layer combo from WFSCapabilities
     *
     * Returns:
     * {Ext.form.ComboBox} the combobox
     */
    var createLayerCombo = function(addon) {
        var url = addon.options.GEOSERVER_WFS_URL.replace(
            /(\/.*\/)wfs/i,
            "$1" + addon.options.LAYER_WORKSPACE + "/wfs"
        );       
        var store = GEOR.ows.WFSCapabilities({
            url: url,
            storeOptions: {
                url: url,
                protocolOptions: {
                    srsName: addon.map.getProjection(),
                    srsNameInQuery: true, // see http://trac.osgeo.org/openlayers/ticket/2228
                    // required so that we do not use the proxy if on same machine:
                    url: url,
                    // to prevent warning message (too many features):
                    maxFeatures: 10
                    
                    // TODO : display message if no data
                }
            }
        });
        return new Ext.form.ComboBox({
            hideLabel: true,
            emptyText:OpenLayers.i18n("traveler.referential.combolayer.emptytext"),
            tooltip:OpenLayers.i18n("traveler.referential.combolayer.tooltip"),
            hidden: true,
            store: store,
            displayField: 'title',
            width: 160,
            listWidth: 160,
            triggerAction: "all",
            editable: false,
            listeners: {
                select: onLayerSelected,
                scope: this
            }
        });
    };

    /*
     * Public
     */
    return createLayerCombo(addon);
};

// create cb to search attribute
GEOR.Addons.Traveltools.cbAttribute = function(record, attStore, fieldSet, inputId, combo, addon) {
    var store, disabled = false;

    /*
     * Remove existante feature     
     */
    var rmFeature = function(addon, id) {
        var arr = addon.featureArray;        
        if (arr[id] && arr[id] != "") {
            var point = addon.layer().getFeatureById(arr[id]);
            addon.layer().removeFeatures(point);
        }       
        if(addon.resultLayer()){
            addon.resultLayer().destroy();
        }
    }

    /*
     * Method: buildTemplate
     * Returns the template suitable for the currently selected layer
     *
     * Parameters:
     * items - {Array} array of attributes names string
     *
     * Returns:
     * {Ext.XTemplate} the template to be used in dataview
     */
    var buildTemplate = function(items) {
        items = items || [];
        var l = items.length;
        var s = new Array(l);
        for (var i = 0; i < l; i++) {
            s[i] = "<strong>" +
                "{[GEOR.util.stringUpperCase(values.feature.attributes." +
                items[i] + ")]}" +
                "</strong>";
        }
        return new Ext.XTemplate(
            '<tpl for=".">' +
            '<div class="x-combo-list-item {[xindex % 2 === 0 ? "even" : "odd"]}">' +
            s.join(' - ') + '</div></tpl>');
    };

    /*
     * Method: onComboSelect
     * Callback executed on result selection: zoom to feature
     *
     * Parameters:
     * record - {Ext.data.Record}
     */
    var onComboSelect = function(record,addon,cb) {
        var layer = addon.layer();
        var arr = addon.featureArray;        
        // get feature attributes from record
        var feature = record.get('feature');
        
        if (!feature) {
            return;
        }
        
        var dataList = feature.data ? feature.data : false;
        var cbStr = "";
        // parse key value table to display 
        if(dataList){
            for (var key in dataList) {
                var a = dataList[key];
                if (dataList.hasOwnProperty(key) && a && a != "") {
                    if(cbStr == ""){
                        cbStr = cbStr + a;
                    } else {
                        cbStr = cbStr + " , " + a;
                    }
                    
                }
            };        
        }        
        
        // get feature geometry
        if (feature.geometry) {                        
            var geometry = feature.geometry.getCentroid();            
            if (geometry.CLASS_NAME == 'OpenLayers.Geometry.Point') {
                rmFeature(addon, inputId);
                if (layer) {
                    var feature = new OpenLayers.Feature.Vector(geometry);
                    arr[inputId] = feature.id;
                    layer.addFeatures(feature);
                    GEOR.Addons.TravelTools.getRoad(addon);
                }
            }            
            // display feature data if exist or coordinates
            if(cbStr && cbStr != ""){
                cb.setValue(cbStr);                       
            } else {
                cb.setValue(feature.geometry.x + " , " + feature.geometry.y);                       
            }            
        }
    };

    /*
     * Property: geometryName
     * {String} the selected layer geometry name
     */
    var geometryName = null;

    var buildFilter = function(queryString, stringAttributes) {
        var l = stringAttributes.length;
        // we might need to replace accentuated chars by their unaccentuated version
        if (addon.options.DEACCENTUATE_REFERENTIALS_QUERYSTRING === true) {
            queryString = GEOR.util.stringDeaccentuate(queryString);
        }
        // and toUpperCase is required, since all the DBF data is UPPERCASED
        var filterValue = '*' + queryString.toUpperCase() + '*';
        if (l == 1) {
            return new OpenLayers.Filter.Comparison({
                type: OpenLayers.Filter.Comparison.LIKE,
                property: stringAttributes[0],
                value: filterValue
            });
        } else {
            var filters = new Array(l);
            for (var i = 0; i < l; i++) {
                filters[i] = new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.LIKE,
                    property: stringAttributes[i],
                    value: filterValue
                });
            }
            return new OpenLayers.Filter.Logical({
                type: OpenLayers.Filter.Logical.OR,
                filters: filters
            });
        }
    };

    var filterStringType = function(attStore) {
        var items = [];
        attStore.each(function(record) {
            var parts = record.get('type').split(':'); // eg: "xsd:string"
            var type = (parts.length == 1) ? parts[0] : parts[1];
            if (type == 'string') {
                items.push(record.get('name'));
            }
        }, this);
        return items;
    };

    if (record && record.get('layer')) {
        // find geometry name
        var idx = attStore.find('type', GEOR.ows.matchGeomProperty);
        if (idx > -1) {
            // we have a geometry
            var r = attStore.getAt(idx);
            geometryName = r.get('name');
        } else {
            // this message is destinated to the administrator
            // no need to display a nice dialog.
            alert(tr("traveler.referential.nogeom"));
        }
        // find the string attribute names:
        var attributes = filterStringType(attStore);
        // create the feature store:
        store = new GeoExt.data.FeatureStore({
            proxy: new GeoExt.data.ProtocolProxy({
                protocol: record.get('layer').protocol
            }),
            listeners: {
                "beforeload": function(store, options) {
                    // add a filter to the options passed to proxy.load,
                    // proxy.load passes these options to protocol.read
                    var params = store.baseParams;
                    options.filter = buildFilter(params['query'], attributes);

                    // with GeoServer2, we need the geometry
                    // since GS2 does not publish bounds as GS1 did
                    // see http://applis-bretagne.fr/redmine/issues/2083
                    options.propertyNames = attributes.concat([geometryName]);

                    // remove the queryParam from the store's base
                    // params not to pollute the query string:
                    delete params['query'];
                },
                scope: this
            }
        });
    } else {
        store = new GeoExt.data.FeatureStore();
    }

    // create combo box
    var cb = new Ext.form.ComboBox({
        loadingText: OpenLayers.i18n("traveler.referential.comboref.loading"),
        fieldClass: "fBan",
        hidden: false,
        hideLabel: true,
        name: 'nothing',
        mode: 'remote',
        minChars: 2,
        disabled: false,
        forceSelection: true,
        width: 160,
        queryDelay: 100,
        listWidth: 160,
        hideTrigger: true,
        queryParam: 'query', // do not modify
        tpl: buildTemplate(attributes),
        pageSize: 0,
        emptyText: OpenLayers.i18n("traveler.referential.comboref.emptytext"),
        store: store,
        listeners: {
            "select": function(combo, record, index) {
                onComboSelect(record,addon,cb);
            },
            "specialkey": function(combo, event) {
                if (event.getKey() == event.ENTER) {
                    onComboSelect(record,addon,cb);
                }
            },
            scope: this
        }
    });

    addon.featureArray[combo.id] = cb.id;
    // hack in order to show the result dataview even
    // in case of "too many features" warning message
    store.on({
        load: function() {
            cb.focus();
            // this one is for IE,
            // since it's not able to focus the element:
            cb.hasFocus = true;
            // focusing the element enables the expand()
            // method to proceed with success
        },
        scope: this
    });
    return cb;
}

GEOR.Addons.TravelTools.parseWkt = function(geom, layer, map, json){
	var road;
    var bounds;
    // to display only one result
    layer.removeAllFeatures();
    if (Ext.getCmp("trav_nav")) {
        Ext.getCmp("trav_nav").hide();
    }
    // get geom from WKT and create feature
    var wkt = new OpenLayers.Format.WKT();
    var features = wkt.read(geom);
    layer.addFeatures(features);

    if (layer.getFeatureById(features.id)) {
        road = layer.getFeatureById(features.id);
    }
    if (road) {
        if (road.constructor != Array) {
            road = [road];
        }
        for (var i = 0; i < road.length; ++i) {
            // get feature bound if not exist
            if (!bounds) {
                bounds = road[i].geometry.getBounds();
            } else {
                bounds.extend(road[i].geometry.getBounds());
            }
        }
        // set point layer to front
        var zIndex = layer.getZIndex() ? layer.getZIndex() : false;
        if (zIndex) {
            addon.layer().setZIndex(zIndex + 1);
        }
        // zoom to result extent
        addon.map.zoomToExtent(bounds);

        // display time and distance informations
        if (json.duration || json.distance) {
            var tCut = json.duration.split(":");
            var tStr = tCut[0] + " h " + tCut[1] + " min";

            if (Ext.getCmp("trav_result")) {
                Ext.getCmp("trav_result").show();
            }

            if (Ext.getCmp("trav_dist") && json.distance) {
                Ext.getCmp("trav_dist").setValue(json.distance);
            }

            if (Ext.getCmp("trav_time") && tStr) {
                Ext.getCmp("trav_time").setValue(tStr);
            }
        }
    } else {
        alert('Bad WKT');
    }
}
};

GEOR.Addons.TravelTools.getRoad = function(addon) {
    var wPCoord = "";
    var method = [];
    var exclusions = [];
    var graphName;
    var settings = new Object();
    var url = addon.options.IGN_URL;
    settings.origin = "";
    settings.destination = "";
    // default projection use to display data on map
    settings.srs = addon.map.getProjectionObject();

    // parse key value table
    for (var key in addon.featureArray) {
        var a = addon.featureArray[key];
        if (addon.featureArray.hasOwnProperty(key) && addon.layer().getFeatureById(a)) {
            var geom = addon.layer().getFeatureById(a).geometry;
            var c = geom.x + "," + geom.y;
            if (key.indexOf("start") > -1) {
                // get origin param
                settings.origin = c;
            } else if (key.indexOf("end") > -1) {
                // get destination param
                settings.destination = c;
            } else {
                // stock others waypoints
                wPCoord = wPCoord + c + ";";
            }
        }
    };
    // waypoints param
    settings.waypoints = wPCoord;
    // get graphName param
    if (Ext.getCmp("carBtn").pressed) {
        settings.graphName = "Voiture";
    } else {
        settings.graphName = "Pieton";
    }
    // get exclusions params
    var checkItems = Ext.getCmp("excludeCheck") ? Ext.getCmp("excludeCheck").items.items : false;
    if (checkItems && checkItems.length > 0) {
        checkItems.forEach(function(el) {
            if (Ext.getCmp(el.id) && Ext.getCmp(el.id).checked) {
                exclusions.push(Ext.getCmp(el.id).value);
            };
        });
    }
    // get method param
    if (Ext.getCmp("timeRadio").checked) {
        settings.method = "TIME";
    } else {
        settings.method = "DISTANCE";
    }   

    if (settings.origin && settings.origin != "" && settings.destination && settings.destination != "") {
        // display load item
        GEOR.waiter.show();
        // fire request
        var request = new OpenLayers.Request.GET({
            url: url,
            params: settings,
            async: true,
            callback: function(request) {
                if (request.responseText) {
                    var decode = JSON.parse(request.responseText);

                    // display result on map and get navigation infos
                    if (decode && decode.geometryWkt) {
                        // create route from WKT 
                        GEOR.Addons.TravelTools.parseWkt(decode.geometryWkt, addon.resultLayer(), addon.layer().map, decode);

                        // get navigation steps
                        if (decode.legs && decode.legs.length > 0) {
                            var steps = [];
                            var section = decode.legs;

                            section.forEach(function(el, index) {
                                el.steps.forEach(function(el, index) {
                                    steps.push(el);
                                })
                            })

                            GEOR.Addons.TravelTools.navInfos = steps;
                        }
                    }
                    // get navigation details from json
                    if (decode.legs && decode.legs.length > 0) {
                        var steps = [];
                        var section = decode.legs;
                        
                        section.forEach(function(el, index) {
                            el.steps.forEach(function(el, index) {
                                steps.push(el);
                            })
                        })
                        if (steps.length > 0) {
                            if (Ext.getCmp("trav_nav")) {
                                Ext.getCmp("trav_nav").show();
                            }
                        }
                    }
                } else {
                    console.log("Request fail");
                }
                GEOR.waiter.hide();
            }
        });
    } else {
        addon.resultLayer().removeAllFeatures();
    }
};

GEOR.Addons.TravelTools.modeButton = function(){
	return new Ext.form.CompositeField({
		items : [{
			xtype : "button",
			tooltip : OpenLayers.i18n("pedestrian"),
			enableToggle : true,
			toggleGroup: "mode"						
		},{
			xtype : "button",
			tooltip : OpenLayers.i18n("vehicle"),
			enableToggle : true,
			pressed:true,
			toggleGroup: "mode"
		}]
	});	
};

GEOR.Addons.TravelTools.addStep = function(isStart, delBtn, idFset){
    var addStr = "add_";
    var rmStr = "rm_";
    var gpsStr = "gps_";
    var inputStr = "field_";

    var travelerAddon = this;
    var layer = this.layer();
    var featureArray = this.featureArray;s

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

    var comboRef = GEOR.Addons.TravelTools.referentials(travelerAddon, fSet, inputId);

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
};

