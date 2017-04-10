Ext.namespace("GEOR");

/**
 * @include OpenLayers/Control/ModifyFeature.js
 * @include OpenLayers/Control/SelectFeature.js
 * @include OpenLayers/Feature/Vector.js
 * @include OpenLayers/Lang.js
 */

GEOR.Isochrone = Ext.extend(Ext.util.Observable, {
	/** api: property[map]
     *  ``OpenLayers.Map``  A configured map object.
     */
	map : null,
	
	resultLayer : null,
	
	wpLayer : null,
		
	selectControl: null,		
	
	service : null,
	
	createIsochrone : null,
	
	addPanel : function(window){
		var epsg4326 = new OpenLayers.Projection("EPSG:4326");
		var epsg3857 = new OpenLayers.Projection("EPSG:3857");
		
		var addon = this;
		
		if(window){					       	        
			
		}
	},
	
	addWindow : null,
	
	/**
	 * private: method[constructor]
	 * Create and init (this) object
	 */
	constructor : function(config){
		Ext.apply(this, config);
		
		this.initMap();
		
	},
	
	initMap: function(){
		if(this.map instanceof GeoExt.MapPanel){
			this.map = this.map.map;
		}
		
		if(!this.map){
			this.map = GeoExt.MapPanel.guess().map;
		}
	},
	
	
	
	CLASS_NAME: "Isochrone"
	
)};