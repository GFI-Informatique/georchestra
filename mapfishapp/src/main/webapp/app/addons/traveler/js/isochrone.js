Ext.namespace("GEOR.Addons.Traveler.isochrone");

GEOR.Addons.Traveler.isochrone.layer = function(map, style){
    var layer, olStyle;    
    if(style){ // get style if exist
    	olStyle = new OpenLayers.StyleMap(style);
    } else{ // or create style
    	olStyle = new OpenLayers.StyleMap({
    		"default": new OpenLayers.Style({
    			strokeColor: "orange",
    			strokeOpacity: 0.5,
    			strokeWidth: 1,
    			fillColor: "orange",
    			fillOpacity: 0.6
    		})
    	});
	}            
    if (map) { // get layer if exist        	
        if (map.getLayersByName("iso_points").length > 0 && map.getLayersByName("iso_points")[0]) {
            layer = map.getLayersByName("iso_points")[0];
        } else { // or create layer
            var layerOptions = OpenLayers.Util.applyDefaults(
                this.layerOptions, {
                    displayInLayerSwitcher: false,
                    projection: map.getProjectionObject(),
                    styleMap: olStyle
                }
            );            
            layer = new OpenLayers.Layer.Vector(id, layerOptions);                
            map.addLayer(layer);
        }
    }
    return layer;	
};

GEOR.Addons.Traveler.isochrone.resultLayer = function(map){
    var layer;           
    if (map) { // get layer if exist        	
        if (map.getLayersByName("iso_points").length > 0 && map.getLayersByName("iso_points")[0]) {
            layer = map.getLayersByName("iso_points")[0];
        } else { // or create layer
            var layerOptions = OpenLayers.Util.applyDefaults(
                this.layerOptions, {
                    displayInLayerSwitcher: false,
                    projection: map.getProjectionObject()                    
                }
            );            
            layer = new OpenLayers.Layer.Vector(id, layerOptions);                
            map.addLayer(layer);
        }
    }
    return layer;	
};

/**
 * Créer ou appeler le controle permettant le dessin d'un point à main levée
 */
GEOR.Addons.Traveler.isochrone.drawControl = function(map, layer, obj, fId){
    if(map){
	    var control = map.getControlsBy("id", "iso_draw").length == 1 ? map.getControlsBy("id", "iso_draw")[0] : false;	
	    // if not exist add control
	    if (map && layer && !control) {
	        var controlOptions = OpenLayers.Util.applyDefaults(
	            this.pointControlOptions, {
	                id: "iso_draw"
	            }
	        );
	        control = new OpenLayers.Control.DrawFeature(layer, OpenLayers.Handler.Point, controlOptions);
	        control.events.on({
	            "featureadded": function() {
	                control.deactivate();
	                if(layer.features.length > 0){
	                	var indx = layer.features.length - 1;	                
		                var feature = layer.features[indx];	                
		                var pId = feature.id;
		                // limit decimals
		                var x = Math.round(feature.geometry.x * 10000) / 10000;
		                var y = Math.round(feature.geometry.y * 10000) / 10000;
		                if (obj) {
		                	// at field id in table, link feature id
		                    obj[fId] = pId;
		                    // display text field
		                    Ext.getCmp(fId).setValue(x + " / " + y);
		                }
	                }	                
	            },
	            scope: this
	        });	
	        map.addControl(control);
	    }	    
	    return control;
    }
};

/**
 * Créer les boutons pour séléctionner le mode de déplacement
 */
GEOR.Addons.Traveler.isochrone.mode = function(){
	return new Ext.form.CompositeField({
		id:"iso_modeCp",
		cls: "cpMode",
		items : [{
			xtype : "button",
			tooltip : OpenLayers.i18n("pedestrian"),
			id:"iso_pedestrian",
			enableToggle : true,
			pressed: false,
			toggleGroup: "iso_mode"
		},{
			xtype : "button",
			tooltip : OpenLayers.i18n("vehicle"),
			id: "iso_vehicle",
			enableToggle : true,
			pressed:true,
			toggleGroup: "iso_mode"
		}]
	});		
};

/**
 * Créer les checkbox pour les zones d'exclusion
 */
GEOR.Addons.Traveler.isochrone.exclusions = function(){
	return new Ext.form.CompositeField({
        id: "iso_exclusions",
        hideLabel: true,
        items:[{
            xtype: "checkbox",
            tooltip: OpenLayers.i18n("traveler.isochrone.boxlabel.toll"),
            boxLabel: OpenLayers.i18n("traveler.isochrone.boxtooltip.toll"),
            id: "iso_toll",
            labelWidth: 20,
            hideLabel: true,
            value: "Toll"
        }, {
            xtype: "checkbox",
            boxLabel: OpenLayers.i18n("traveler.isochrone.boxlabel.bridge"),
            tooltip: OpenLayers.i18n("traveler.isochrone.boxtooltip.bridge"),
            id: "iso_bridge",
            hideLabel: true,
            value: "Bridge"
        }, {
            xtype: "checkbox",
            boxLabel: OpenLayers.i18n("traveler.isochrone.boxlabel.tunels"),
            tooltip: OpenLayers.i18n("traveler.isochrone.boxtooltip.tunels"),
            id: "iso_tunnel",
            hideLabel: true,
            value: "Tunnel"
        }]
	});
};

/**
 * Créer le champ de recherche d'une adresse BAN
 */
GEOR.Addons.Traveler.isochrone.ban = function(map,layer, service){
    // TODO : set service URL in config.json file, more informations in README
	var epsg4326 = new OpenLayers.Projection("EPSG:4326");	    
    var banStore = new Ext.data.JsonStore({ // create store
        proxy: new Ext.data.HttpProxy({
            url: service,
            method: "GET",
            autoLoad: true
        }),
        root: "features",
        fields: [{
                name: "typeGeometry",
                convert: function(v,rec) {
                    return rec.geometry.type;
                }
            },
            {
                name: "coordinates",
                convert: function(v,rec) {
                    return rec.geometry.coordinates;
                }
            },
            {
                name: "id",
                convert: function(v,rec) {
                    return rec.properties.id;
                }
            },
            {
                name: "label",
                convert: function(v,rec) {
                    return rec.properties.label;
                }
            }
        ],
        totalProperty: "limit",
        listeners: {
            "beforeload": function(q) {
                banStore.baseParams.q = banStore.baseParams["query"];
                banStore.baseParams.limit = 5;
                delete banStore.baseParams["query"];
            }
        }
    });    
    return new Ext.form.ComboBox({ // create comboBox
        anchor: 200,
        id: "iso_ban",
        emptyText: OpenLayers.i18n("isochron.ban.title"),
        tooltip: OpenLayers.i18n("isochron.ban.tooltip"),
        hideLabel: true,
        hideTrigger: true,
        store: banStore,
        displayField: "label",
        hideTrigger: true,
        pageSize: 0,
        minChars: 5,
        listeners: {
            "select": function(combo, record) {
                if (layer && map) {
                    var lon = record.json.geometry.coordinate[0];
                    var lat = record.json.geometry.coordinate[1];
                    var geom = new OpenLayers.Geometry.Point(lon, lat).transform(epsg4326, map.getProjection());
                    var point = new OpenLayers.Geometry.Point(geom.x, geom.y);
                    var feature = new OpenLayers.Feature.Vector(point);
                    layer.addFeatures(feature);
                }
            },
            scope: this
        }
    });
};

/**
 *  Zone de saisie d'un point
 */
GEOR.Addons.Traveler.isochrone.banField = function(map, layer, banEl, control){
	return new Ext.form.CompositeField({
        hideLabel: true,
        anchor: "100%",
        items: [banEl, {
            xtype: "button",
            iconCls: "gpsIcon",
            tooltip: tr("traveler.drawpoint.tooltip"),
            cls: "actionBtn",
            handler: function(button) {
                // manage draw control
                if (control && layer) {
                    if (!control.active) {
                        control.activate();
                        layer.removeAllFeatures();
                    } else {
                        control.deactivate();
                    }
                }
            }
        }]
    });
};



/**
 *  Création de la fenêtre de l'outil
 */
GEOR.Addons.Traveler.isochrone.window = function(mode, ban, exclusion){
	var tr = OpenLayers.i18n;
	var tool = this;		
	if(Ext.getCmp("iso_win")){
		return Ext.getCmp("travel_win").destroy();
	} else {				
		return new Ext.Window({
			id: "iso_win",
			title: tr("isochrone.window.title"),
			constrainHeader: true,
			//autoHeight: true,
			width: 290,
			autoScroll: true,
			closable: true,
			closeAction: "hide",
			resizable: true,
			collapsible: true,
			buttonAlign: "center",
			items:[{
				xtype: "panel",
				id: "iso_panel",
				items: [mode,{            
                    xtype: "fieldset",
                    collapsible: true,
                    collapsed: true,
                    id: "isoPanFset",
                    title: OpenLayers.i18n("traveler.options.title"),
                    items: [ban,exclusion]
				}]
			}]
		});
	}	
};