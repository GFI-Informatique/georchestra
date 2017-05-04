Ext.namespace("GEOR.Addons");

GEOR.Addons.Traveler = Ext.extend(GEOR.Addons.Base, {
    /**
     * Method: map
     * get current map     
     */
    map: this.map,    
    
    /**
     * Method: loader
     * create loader     
     */    
    loader: function(){
    	return new Ext.LoadMask(Ext.getBody(), {msg: OpenLayers.i18n("Traveler.isochrone.msg.loader")})
	},

    /**
     * Method: isoControl
     * isochrone control to draw isochrone start points     
     */
	isoControl: null,
	
	/**
     * Method: isoControl
     * isochrone control to draw route start points     
     */
	routeControl: null,
    /**
     * Method: featureRouteArray
     * create object containing way point
     */      
    featureArray: new Object(),
    
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
    
    /**
     * Method: isoLayer
     * start point layer     
     */
    isoLayer : null,
    
    /**
     * Method: isoResLayer
     * isochrones polygon layer  
     */
    isoResLayer : null,
           
    /**
     * Method: lastFieldUse
     * get last field use to create link between point and field id to destroy point when field is remove
     */
    lastFieldUse: null,
    
   
    /**
     * Method: init
     *
     * Parameters:
     * record - {Ext.data.record} a record with the addon parameters
     */
    init: function(record) {
    	var addon = this;
    	if(!addon.map){ // init map addon if not exist
    		addon.map = GeoExt.MapPanel.guess().map;
    	}
    	
    	var items = [
	         new Ext.menu.CheckItem(
	             new Ext.Action({
	                 text: OpenLayers.i18n("isochrone"),
	                 qtip: OpenLayers.i18n("isochrone"),
	                 //handler: isochrone.window(),
	                 map: this.map,
	                 group: "_travel",
	                 iconCls: "addon-isochrone-icon",
	                 id:"iso_tool",
	                 listeners:{
	                	"click": function(box){
		                	 if(!Ext.getCmp("iso_win")){
		                		 // create items
		                		 addon.isoLayer = GEOR.Addons.Traveler.isochrone.layer(addon);
			                	 addon.isoResLayer = GEOR.Addons.Traveler.isochrone.resultLayer(addon);
			                	 var isoMode = GEOR.Addons.Traveler.isochrone.mode();
			                	 var isoExclud = GEOR.Addons.Traveler.isochrone.exclusions();
			                	 var banCb = GEOR.Addons.Traveler.isochrone.ban(addon);
			                	 addon.isoControl = GEOR.Addons.Traveler.isochrone.drawControl(addon, banCb.id);
			                	 var isoBan = GEOR.Addons.Traveler.isochrone.banField(addon, banCb);
			                	 var isoFielSet = GEOR.Addons.Traveler.isochrone.pointFset(addon, isoBan);
			                	 var isoTime = GEOR.Addons.Traveler.isochrone.time(addon);
			                	 // create window to finalize isochrone init
			                	 var isoWin = GEOR.Addons.Traveler.isochrone.window(isoMode,isoFielSet, isoExclud, addon, isoTime);		                	 	                			                	 
			                	 isoWin.show();		                	 
		                	 } else {
		                		 var window = Ext.getCmp("iso_win");
		                		 if(!window.isVisible()){
		                			 window.show();
		                		 }
		                	 }	                	 	                	 
	                	} 
	                 }
	             })
	         ), new Ext.menu.CheckItem(
	             new Ext.Action({
	                 text: OpenLayers.i18n("route"),
	                 qtip: OpenLayers.i18n("route"),
	                 map: this.map,
	                 group: "_travel",
	                 iconCls: "addon-route-icon",
	                 listeners:{
	                	 "click": function(box){
	                		 addon.routePoints = GEOR.Addons.Traveler.route.pointsLayer(addon); // start points layer
                			 addon.routeLines = GEOR.Addons.Traveler.route.linesLayer(addon);  // result layer
                			 addon.routeControl = GEOR.Addons.Traveler.route.routeControl(addon);
                			 addon.routeWindow = GEOR.Addons.Traveler.route.routeWindow(addon);
                			 addon.routeWindow.show();
                			 
                			 
	                	 }
	                 }
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