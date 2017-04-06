Ext.namespace("GEOR.Addons");

GEOR.Addons.isotools = Ext.extend(GEOR.Addons.Base, {

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
     * Method: init
     *
     * Parameters:
     * record - {Ext.data.record} a record with the addon parameters
     */
    init: function(record) {     

        if (this.target) {
            // create a button to be inserted in toolbar:
            this.components = this.target.insertButton(this.position, {
                xtype: "button",
                iconCls: "addon-icon",
                handler: this._onCheckchange,
                scope: this
            });
            this.target.doLayout();
        } else {
            // create a menu item for the "tools" menu:
            this.item = new Ext.menu.CheckItem({
                text: this.getText(record),
                qtip: this.getQtip(record),
                iconCls: "addon-icon",
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
    },

    /**
     * Method: destroy
     * Called by GEOR_tools when deselecting this addon
     */
    destroy: function() {
        GEOR.Addons.Base.prototype.destroy.call(this);
    }
});