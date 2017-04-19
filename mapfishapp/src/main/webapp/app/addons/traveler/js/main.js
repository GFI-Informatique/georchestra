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
    isoStart: new Object(),
       
    /**
     * Method: isoResult
     * create object to link result to line
     */
    isoResult: new Object(),
    
    isoLayer : null,
    isoResLayer : null,
           
    /**
     * Method: routeField
     * get last field use to localize last way point
     */
    routeField: null,  
    
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
	                		 // create items
	                		 var isoLayer = GEOR.Addons.Traveler.isochrone.layer(addon.map, addon.options.POINT_STYLE);
		                	 addon.isoResLayer = GEOR.Addons.Traveler.isochrone.resultLayer(addon.map);
		                	 var isoMode = GEOR.Addons.Traveler.isochrone.mode();
		                	 var isoExclud = GEOR.Addons.Traveler.isochrone.exclusions();
		                	 var banCb = GEOR.Addons.Traveler.isochrone.ban(addon.map,isoLayer, addon.options.BAN_URL, addon.isoStart);
		                	 var isoControl = GEOR.Addons.Traveler.isochrone.drawControl(addon.map, isoLayer, addon.isoStart, banCb.id);
		                	 var isoBan = GEOR.Addons.Traveler.isochrone.banField(addon.map, isoLayer, banCb, isoControl);
		                	 var isoFielSet = GEOR.Addons.Traveler.isochrone.pointFset(addon, isoBan);
		                	 var isoTime = GEOR.Addons.Traveler.isochrone.time(addon);
		                	 // create window to finalize isochrone init
		                	 var isoWin = GEOR.Addons.Traveler.isochrone.window(isoMode,isoFielSet, isoExclud, addon, isoTime);		                	 	                			                	 
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