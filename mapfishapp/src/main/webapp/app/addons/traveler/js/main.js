Ext.namespace("GEOR.Addons");

GEOR.Addons.Traveler = Ext.extend(GEOR.Addons.Base, {
    /**
     * Method: map
     * get current map     
     */
    map: null,    
    
    /**
     * Method: featureRouteArray
     * create object containing way point
     */      
    featureRouteArray: new Object(),
    
    /**
     * Method: featureIsoArray
     * create object containing start point
     */
    featureIsoArray: new Object(),
       
    /**
     * Method: routeField
     * get last field use to localize last way point
     */
    routeField: null,
    
    /**
     * Method: getLayer
     * create or return layer according to a given identifier
     * Params : 
     * 		id - {string}      
     * 		style - {string} name option corresponding to style set as option in manifest.json or config.json
     */    
    layer: function(id, style) {
        var layer, style;
        var addon = this;
        
        if(style){
        	style = new OpenLayers.StyleMap(style);
        } else{ 
        	style = new OpenLayers.StyleMap({
        		"default": new OpenLayers.Style({
        			strokeColor: "orange",
        			strokeOpacity: 0.5,
        			strokeWidth: 1,
        			fillColor: "orange",
        			fillOpacity: 0.6
        		})
        	});
    	}
                
        if (this.map) {
            // create and add layer to map if not exist        	
            if (addon.map.getLayersByName(id).length == 1) {
                layer = this.map.getLayersByName(id)[0];
            } else {            	
            	// create layer options as style, project
                var layerOptions = OpenLayers.Util.applyDefaults(
                    this.layerOptions, {
                        displayInLayerSwitcher: false,
                        projection: addon.map.getProjectionObject(),
                        styleMap: style
                    }
                );
                
                layer = new OpenLayers.Layer.Vector(id, layerOptions);                
                this.map.addLayer(layer);
            }
        }
        return layer;
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

        if (this.map) {
            // create and add layer to map if not exist
            if (this.map.getLayersByName("traveler_result").length == 1) {
                resultLayer = this.map.getLayersByName("traveler_result")[0];
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
     * Method: removeFeature
     * Remove layer feature from given layers and given table key
     * Parameters: 
     *    	cmpId - {string} id of ExtJs element
     *      layer - {OpenLayers.Layer.Vector} layer use to display features points
     *      resultLayer - OpenLayers.Layer.Vector} layer use to display results features
     * 		arr - {Object} JS object containing field id and corresponding feature id 
     */
    removeFeature: function(cmpId, layer, resultLayer, arr) {       
        var addon = this;
        var o = Ext.getCmp(cmpId) ? Ext.getCmp(cmpId) : false;
        if (o) {
            o.setValue("");
        }

        if (arr[id] && arr[id] != "") {
            var point = layer.getFeatureById(arr[id]);
            layer.removeFeatures(point);
            arr[id] = "";
            if (layer.features.length > 1) {
                GEOR.Addons.Traveler.getRoad(addon);
            } else {
                resultLayer.removeAllFeatures();
                if(Ext.getCmp("trav_nav")){
                	Ext.getCmp("trav_nav").hide();
                }
            }
        }
    },
    
    /**
     * Method: resizeShadow
     * Synchronize shadow with window
     * Parameters:
     * 		panel - {Ext.form.Panel} panel to contain field and search options
     * 		window - {Ext.form.Window} main window use to calculate route
     * 		method - {function} addon method to add new fieldSet
     */

    resizeShadow: function(win) {
        if (win) {
            win.syncShadow()
        }
    },

    /**
     * Method: init
     *
     * Parameters:
     * record - {Ext.data.record} a record with the addon parameters
     */
    init: function(record) {
    	var addon = this;
    	var items = [
	         new Ext.menu.CheckItem(
	             new Ext.Action({
	                 text: OpenLayers.i18n("isochrone"),
	                 qtip: OpenLayers.i18n("isochrone"),
	                 //handler: isochrone.window(),
	                 map: this.map,
	                 group: "_travel",
	                 iconCls: "addon-icon",
	                 handler: function(box){
	                	 if(!Ext.getCmp("iso_win")){
	                		 var isoLayer = GEOR.Addons.Traveler.isochrone.layer(addon.map, addon.options.POINT_STYLE);
		                	 var isoResLayer = GEOR.Addons.Traveler.isochrone.resultLayer(addon.map);
		                	 var isoControl = GEOR.Addons.Traveler.isochrone.drawControl(addon.map, isoLayer, addon.featureIsoArray, addon.isoField);
		                	 var isoMode = GEOR.Addons.Traveler.isochrone.mode();
		                	 var isoExclud = GEOR.Addons.Traveler.isochrone.exclusions();
		                	 var banCb = GEOR.Addons.Traveler.isochrone.ban(addon.map,isoLayer, addon.options.BAN_URL);
		                	 var isoBan = GEOR.Addons.Traveler.isochrone.banField(addon.map, isoLayer, banCb, isoControl);
		                	 var isoFset = GEOR.Addons.Traveler.isochrone.pointFset(addon, isoBan);

		                	 var isoWin = GEOR.Addons.Traveler.isochrone.window(isoMode,isoFset, isoExclud);
		                	 isoWin.show();
		                	 
	                	 } else {
	                		 Ext.getCmp("iso_win").destroy();
	                	 }	                	 	                	 
	                 }
	             })
	         ), new Ext.menu.CheckItem(
	             new Ext.Action({
	                 text: OpenLayers.i18n("route"),
	                 qtip: OpenLayers.i18n("route"),
	                 //handler: this.openIsochrone,
	                 map: this.map,
	                 group: "_travel",
	                 iconCls: "addon-icon"
	             })
	         )
        ];               
        this.items = items;        
    },

    /**
     * Method: destroy
     * Called by GEOR_tools when deselecting this addon
     */
    destroy: function() {
        GEOR.Addons.Base.prototype.destroy.call(this);
    }
});