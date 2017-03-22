Ext.namespace("GEOR");




GEOR.Addons.traveler.referentials = function(map, options, fieldSet, featureArray, layer, inputId) {


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
    var onLayerSelected = function(combo, record, index) {
        var idx = record.get('name');

        var pos = fieldSet.items.length;


        GEOR.waiter.show();
        var protocol = record.get('layer').protocol;


        if (fieldSet) {

            // check if panel already exists
            if (featureArray[combo.id]) {
                Ext.getCmp(featureArray[combo.id]).destroy();
            }



            var attStore = GEOR.ows.WFSDescribeFeatureType({
                owsURL: protocol.url,
                typeName: idx
            }, {
                success: function() {

                    var cb = GEOR.Addons.traveler.cbAttribute(record, attStore, fieldSet, inputId, featureArray, options, layer, combo);


                    // load  cbStore;

                    // add new panel containing combo to card layout

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
    var createLayerCombo = function(options) {
        var url = options.GEOSERVER_WFS_URL.replace(
            /(\/.*\/)wfs/i,
            "$1" + options.LAYER_WORKSPACE + "/wfs"
        );
        var store = GEOR.ows.WFSCapabilities({
            url: url,
            storeOptions: {
                url: url,
                protocolOptions: {
                    srsName: map.getProjection(),
                    srsNameInQuery: true, // see http://trac.osgeo.org/openlayers/ticket/2228
                    // required so that we do not use the proxy if on same machine:
                    url: url,
                    // to prevent warning message (too many features):
                    maxFeatures: 10
                }
            }
        });

        return new Ext.form.ComboBox({
            hideLabel: true,
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
    return createLayerCombo(options);
};




// create cb to search attribute
GEOR.Addons.traveler.cbAttribute = function(record, attStore, fieldSet, inputId, featureArray, options, layer, combo) {
    var store, disabled = false;


    /*
     * Remove existante feature
     *
     */
    var rmFeature = function(arr, layer, id) {
        if (arr[id] && arr[id] != "") {
            var point = layer.getFeatureById(arr[id]);
            layer.removeFeatures(point);
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
    var onComboSelect = function(record) {
        var feature = record.get('feature');
        if (!feature) {
            return;
        }
        if (feature.geometry) {
            var geometry = feature.geometry;
            if (geometry.CLASS_NAME == 'OpenLayers.Geometry.Point') {
                rmFeature(featureArray, layer, inputId);
                if (layer) {
                    var feature = new OpenLayers.Feature.Vector(geometry);
                    featureArray[inputId] = feature.id;
                    layer.addFeatures(feature);
                }
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
        if (options.DEACCENTUATE_REFERENTIALS_QUERYSTRING === true) {
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
            alert(tr("There is no geometry column in the selected referential"));
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
        loadingText: "Loading...",
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
        emptyText: disabled ? "Choose a referential" : '',
        store: store,
        listeners: {
            "select": function(combo, record, index) {
                onComboSelect(record);
            },
            "specialkey": function(combo, event) {
                if (event.getKey() == event.ENTER) {
                    onComboSelect(record);
                }
            },
            scope: this
        }
    });

    featureArray[combo.id] = cb.id;
    console.log(featureArray);

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