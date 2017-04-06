Ext.namespace("GEOR");

/**
 * @include OpenLayers/Control/ModifyFeature.js
 * @include OpenLayers/Control/SelectFeature.js
 * @include OpenLayers/Feature/Vector.js
 * @include OpenLayers/Lang.js
 */

GEOR.Isochrone = Ext.extend(Ext.util.Observable, {
	
	map : null,
	
	resultLayer : null,
	
	modifyControl : null,
	
	selectControl: null,
	
	popup: null,
	
	resultStyle : null,
	
	originStyle : null,
	
	service : null,
	
	panel : null,
	
	layerOptions : {},
	
	onModificationStart : function(){},
	
	onModificationEnd : function(){},
	
	CLASS_NAME: "Annotation"
	
)};