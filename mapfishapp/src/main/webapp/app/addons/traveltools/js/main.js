Ext.namespace("GEOR.Addons");

GEOR.Addons.Traveltools = Ext.extend(GEOR.Addons.Base, {

    win: null,
    addressField: null,
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
     * Method: getLayer
     * 
     * create or return layer according to a given identifier
     * 
     * Params : 
     * 		id - {string}      
     * 		style - {string} name option corresponding to style set as option in manifest.json or config.json
     */
    
    layer: function(id, style) {
        var layer;
        var addon = this;
        var style = new OpenLayers.StyleMap(addon.options.style);        


        if (addon.map) {

            // create and add layer to map if not exist
        	
            if (addon.map.getLayersByName(id).length == 1) {
                layer = addon.map.getLayersByName(id)[0];
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
                this.map.addLayer(layerAddon);
            }
        }
        return layer;
    },
    
    /**
     * Method: openIsochrone
     * call isochrone tools
     */
    openIsochrone: null,
    
    /**
     * Method: openRoute
     * call route tools
     */
    openRoute: null,

    /**
     * Method: init
     *
     * Parameters:
     * record - {Ext.data.record} a record with the addon parameters
     */
    init: function(record) {     
        var items = [
	         new Ext.menu.CheckItem(
	             new Ext.Action({
	                 text: OpenLayers.i18n("travel_route"),
	                 qtip: OpenLayers.i18n("travel_route"),
	                 handler: this.openRoute,
	                 map: this.map,
	                 group: "_travel",
	                 iconCls: "addon-icon"
	             })
	         ), new Ext.menu.CheckItem(
	             new Ext.Action({
	                 text: OpenLayers.i18n("travel_isochrone"),
	                 qtip: OpenLayers.i18n("travel_isochrone"),
	                 handler: this.openIsochrone,
	                 map: this.map,
	                 group: "_travel",
	                 iconCls: "addon-icon"
	             })
	         )
        ];
    	
        if (this.target) {
            // addon placed in toolbar
            this.components = this.target.insertButton(this.position, items);
            this.target.doLayout();
        } else {
            // addon outputs placed in "tools menu"
            this.items = items;
        }
    },

    /**
     * Method: _onCheckchange Callback on checkbox state changed
     * when called from toolbar button, checked is an mouseevent object
     * when called from tools menu checkitem or manually from openToolbarOnLoad, checked is a boolean
     */

    _onCheckchange: function() {
    },

    /**
     * Method: destroy
     * Called by GEOR_tools when deselecting this addon
     */
    destroy: function() {
        GEOR.Addons.Base.prototype.destroy.call(this);
    }
});