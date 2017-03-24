Ext.namespace("GEOR");

GEOR.Addons.traveler.getRoad = function(addon) {


    var wPCoord = "";
    var method = [];
    var exclusions = [];
    var graphName;
    var settings = new Object();
    var url = addon.options.IGN_URL;

    settings.origin = "";
    settings.destination = "";
    
    // default projection use to display data on map
    settings.srs = addon.map.getProjectionObject();;

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


    // parse geom from service to display result and zoom on bound
    function parseWKT(geom, layer, map, json) {
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

            // here, populate result fields with informations
            
            var d = json.distance;
            var ts = json.durationSeconds;
            var t = json.duration;
            
            var tCut = t.split(":");
            var tStr = tCut[0]+" h "+tCut[1]+" min";
            
            if (Ext.getCmp("trav_result")) {
                Ext.getCmp("trav_result").show(); 
            }
            
            if (Ext.getCmp("trav_dist") && t) {
                Ext.getCmp("trav_dist").setValue(d); 
            }

            if (Ext.getCmp("trav_time") && t) {
                Ext.getCmp("trav_time").setValue(tStr);
            }         

        } else {
            alert('Bad WKT');
        }
        
    }

    if (settings.origin && settings.origin != "" && settings.destination && settings.destination != "") {
        // fire request
        GEOR.waiter.show();
        var request = new OpenLayers.Request.GET({
            url: url,
            params: settings,
            async: true,
            callback: function(request) {
                if (request.responseText) {
                    var decode = JSON.parse(request.responseText);
                    if (decode && decode.geometryWkt) {
                        // get geom from json 
                        var geomWKT = decode.geometryWkt;

                        // create route from WKT 
                        parseWKT(geomWKT, addon.resultLayer(), addon.layer().map, decode);
                    }
                }
            }
        });
    } else {
        addon.resultLayer().removeAllFeatures();
    }

};