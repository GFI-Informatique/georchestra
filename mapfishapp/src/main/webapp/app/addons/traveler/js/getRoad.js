Ext.namespace("GEOR");

GEOR.Addons.traveler.getRoad = function(addon) {

    var wPCoord = "";
    var method = [];
    var srs;
    var exclusions = [];
    var graphName;
    var settings = new Object();
    var url = addon.options.IGN_URL;


    settings.origin = "";
    settings.destination = "";

    settings.srs = addon.options.EPSG;

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
    function getExclusion(arr, dest) {
        arr.forEach(function(el, dest) {
            if (Ext.getCmp(el.id) && Ext.getCmp(el.id).checked) {
                dest.push(Ext.getCmp(el.id).value);
            };
        });

    }

    var checkItems = Ext.getCmp("excludeCheck") ? Ext.getCmp("excludeCheck").items.items : false;
    if (checkItems && checkItems.length > 0) {
        getExclusion(checkItems, exclusions);
    }

    // get method param
    if (Ext.getCmp("timeRadio").checked) {
        settings.method = "TIME";
    } else {
        settings.method = "DISTANCE";
    }


    // parse geom from service to display result and zoom on bound
    function parseWKT(geom, layer, map) {
        var road;

        // to display only one result
        layer.removeAllFeatures();

        // get geom from WKT and create feature
        var wkt = new OpenLayers.Format.WKT();
        var features = wkt.read(geom);

        layer.addFeatures(features);


        if (layer.getFeatureById(features.id)) {
            road = layer.getFeatureById(features.id);
        }
        var bounds;
        if (road) {
            if (road.constructor != Array) {
                road = [road];
            }
            for (var i = 0; i < road.length; ++i) {
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
        } else {
            alert('Bad WKT');
        }
    }

    if (settings.origin != "" && settings.destination != "") {
        // fire request
        var request = new OpenLayers.Request.GET({
            url: url,
            params: settings,
            async: true,
            callback: function(request) {
                if (request.responseText) {
                    var decode = JSON.parse(request.responseText);
                    if (decode && decode.geometryWkt) {
                        var geomWKT = decode.geometryWkt;

                        // create route from WKT 
                        parseWKT(geomWKT, addon.resultLayer(), addon.layer().map);
                    }
                }
            }
        });
    } else {
        addon.resultLayer().removeAllFeatures();
    }

};