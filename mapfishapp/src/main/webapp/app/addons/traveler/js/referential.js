Ext.namespace("GEOR.Addons.Traveler.referential");

GEOR.Addons.Traveler.referential.create = function(addon, fieldSet, inputId) {
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
     *
     */
    var onLayerSelected = function(combo, record, index) { // add new combo under layer combo
    	// display waiter
    	GEOR.waiter.show();
    	
    	var idx = record.get('name');
        var pos = fieldSet.items.length;             
        var protocol = record.get('layer').protocol;

        if (fieldSet) {

            // check if combo already exists
            if (addon.featureArray[combo.id]) {
                Ext.getCmp(addon.featureArray[combo.id]).destroy();
            }

            var attStore = GEOR.ows.WFSDescribeFeatureType({
                owsURL: protocol.url,
                typeName: idx
            }, {
                success: function() {
                	// cb to input and select item
                    var cb = GEOR.Addons.Traveler.cbAttribute(record, attStore, fieldSet,  combo, addon, inputId);
                    // add new panel containing combo to card layout
                    fieldSet.insert(pos, cb);
                    
                    // refresh panel layout
                    if (Ext.getCmp(idPanel)) {
                        Ext.getCmp(idPanel).doLayout();
                    }
                },
                failure: function() {
                	// hide waiter
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
            emptyText: OpenLayers.i18n("traveler.referential.combolayer.emptytext"),
            tooltip: OpenLayers.i18n("traveler.referential.combolayer.tooltip"),
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
GEOR.Addons.Traveler.cbAttribute = function(record, attStore, fieldSet, combo, addon, inputId) {
    var store, disabled = false;

    /*
     * Remove existante feature
     *
     */
    var rmFeature = function(addon, id) {    	
        var arr = addon.featureArray;

        if (arr[id] && arr[id] != "") {
            var point = addon.layer().getFeatureById(arr[id]);
            addon.layer().removeFeatures(point);
        }

        if (addon.resultLayer()) {
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
    var onComboSelect = function(record, addon, cb) {
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
        if (dataList) {
            for (var key in dataList) {
                var a = dataList[key];
                if (dataList.hasOwnProperty(key) && a && a != "") {
                    if (cbStr == "") {
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
                if (layer) {
                    var feature = new OpenLayers.Feature.Vector(geometry);
                	if(inputId){
                		rmFeature(addon, inputId);
                		arr[inputId] = feature.id;
                	} else {
                		layer.removeAllFeatures();
                	}                    
                    layer.addFeatures(feature);
                    GEOR.Addons.traveler.getRoad(addon);
                }
            }

            // display feature data if exist or coordinates
            if (cbStr && cbStr != "") {
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
                onComboSelect(record, addon, cb);
            },
            "specialkey": function(combo, event) {
                if (event.getKey() == event.ENTER) {
                    onComboSelect(record, addon, cb);
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