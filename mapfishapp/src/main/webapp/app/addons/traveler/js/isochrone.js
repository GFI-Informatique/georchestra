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
			cls:"mode-button",
			iconCls:"pedestrian",
			enableToggle : true,
			allowDepress: false,
			pressed: false,
			toggleGroup: "iso_mode",
			listeners: {
				toggle: function(b){
					if(b.pressed){b.setIconClass("pedestrian-pressed");}
					else {b.setIconClass("pedestrian");}
				}
			}
		},{
			xtype : "button",
			tooltip : OpenLayers.i18n("vehicle"),
			id: "iso_vehicle",
			iconCls: "vehicle",
			cls:"mode-button",
			allowDepress: false,
			enableToggle : true,
			pressed:true,
			toggleGroup: "iso_mode",
			listeners: {
				toggle: function(b){
					if(b.pressed){b.setIconClass("vehicle-pressed");}
					else {b.setIconClass("vehicle");}
				}
			}		
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
            boxLabel: OpenLayers.i18n("traveler.isochrone.boxtooltip.toll"),
            id: "iso_toll",
            labelWidth: 20,
            hideLabel: true,
            value: "Toll"
        }, {
            xtype: "checkbox",
            boxLabel: OpenLayers.i18n("traveler.isochrone.boxlabel.bridge"),
            id: "iso_bridge",
            hideLabel: true,
            value: "Bridge"
        }, {
            xtype: "checkbox",
            boxLabel: OpenLayers.i18n("traveler.isochrone.boxlabel.tunels"),
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
        emptyText: OpenLayers.i18n("isochron.ban.emptytext"),
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
            tooltip: tr("isochrone.draw.tooltip"),
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
 * Check box pour utiliser le référentiel de données
 */
GEOR.Addons.Traveler.isochrone.refentialBox = function(banField, comboRef){
	var tr = OpenLayers.i18n;
    return new Ext.form.Checkbox({
        hideLabel: true,
        hidden: false,
        boxLabel: tr("traveler.isochrone.rerential.boxlabel"),
        listeners: {
            "check": function() {
                if (this.checked) {
                    banField.hide();
                    comboRef.show();
                } else {
                    comboRef.hide();
                    banField.show();
                }
            }
        }
    });
};

/**
 * Check box pour récupérer la géométrie stockée sur le navigateur
 */
GEOR.Addons.Traveler.isochrone.geometryBox = function(){
	var tr = OpenLayers.i18n;
    return new Ext.form.Checkbox({
        hideLabel: true,
        hidden: false,
        boxLabel: tr("traveler.isochrone.searchgeometry"),
        listeners: {
            "check": function() {
                // get geometry from brower
            }
        }
    });
};

/**
 * Création du filedset contenant la combo box ban
 */
GEOR.Addons.Traveler.isochrone.pointFset = function(addon, ban){
	var items = [];
	
	var fields = new Ext.form.FieldSet({
        autoWidht: true,
        hideLabel:true,
        cls: "fsStep",
        id: "iso_input",
        items:[ban]
    });	
	
	var comboRef =  GEOR.Addons.Traveler.referential.create(addon, fields);
	
	if(comboRef){
		fields.add(comboRef);
	}
	
	// create refenretial checkBox
    if (comboRef.getStore() && (comboRef.getStore().url || !comboRef.getStore().url == "")) { 
    	var checkRef = GEOR.Addons.Traveler.isochrone.refentialBox(ban, comboRef);   	    	
    }    
    if(checkRef){
    	items.push(checkRef)
    }
    
    // insert geometry check box
    var geomBox = GEOR.Addons.Traveler.isochrone.geometryBox() ? GEOR.Addons.Traveler.isochrone.geometryBox() : false;  
    if(geomBox){
    	items.push(geomBox);
    }
    
    if(items.length > 0){
    	var cpField = new Ext.form.CompositeField({
    		hideLabel:true,
    		id:"iso_cpfCheck",
    		items: items
    	});
    	fields.insert(0,cpField);
    }
    
    return fields;
};


/**
 * Insérer un compositefield d'affichage du résultat dans la zone Résultat
 * On insére dans une table : 
 * 		- clé : identifiant de la ligne
 * 		- valeur : le numéro de la ligne
 * 
 *  Permet de retrouver le 
 */

GEOR.Addons.Traveler.isochrone.insertResult = function(table, isochrones){
	if(Ext.getCmp("iso_result")){
		var zone = Ext.getCmp("iso_result");
		var len = zone.items.length - 1;		
		var cpf = new Ext.form.CompositeField({
			items:[{
				xtype: "textfield",
				value: "Recherche "+ len				
			},{
				xtype:"button",
				text: "Del"
			},{
				xtype:"button",
				text:"Sav"
			}]
		});			
		zone.insert(len, cpf);
		
		resObj[cpf.id] = len;
	}
};

GEOR.Addons.Traveler.isochrone.createIsochrone = function(service,){
	var settings = {};
	var check = [];
	// get exclusions checked
	var checkItems  = Ext.getCmp("iso_exclusions") ? Ext.getCmp("iso_exclusions").items.items : false;	
    if (checkItems && checkItems.length > 0) {
        checkItems.forEach(function(el) {
            if (Ext.getCmp(el.id) && Ext.getCmp(el.id).checked) {
            	check.push(Ext.getCmp(el.id).value);
            };
        });
        settings.exclusions = check;
    }
    
    //get graphName 
    if(Ext.getCmp("iso_pedestrian") && Ext.getCmp("iso_pedestrian").pressed){
    	settings.graphName = "Pieton";
	} else {
		settings.graphName = "Voiture";
	}    
	
	// get geom
    
	// get options
	
	// fire calcul
	
	return new OpenLayers.Request.GET({
		url: service,
		params: settings,
		callback: function(request){
			
		}
	});
}; 


/**
 *  Création de la fenêtre de l'outil
 */
GEOR.Addons.Traveler.isochrone.window = function(mode, fSet, exclusion){
	var tr = OpenLayers.i18n;	
    
	var win =  new Ext.Window({
		id: "iso_win",
		title: tr("isochrone.window.title"),
		constrainHeader: true,
		autoHeight: true,
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
			items: [mode,fSet,{            
                xtype: "fieldset",
                collapsible: true,
                collapsed: true,
                cls: "fsStep",
                id: "iso_options",
                title: tr("traveler.options.title"),
                items: [exclusion],
                listeners:{
                	"collapse": function(){ win.syncShadow();},
                	"expand": function(){ win.syncShadow();}
                }
			},{
				xtype:"spacer",
				height:"5"
			},{
				xtype: "fieldset",
			    collapsible: true,
			    hidden:false,
			    collapsed: true,
			    cls: "fsStep",
			    id: "iso_result",
			    title: tr("traveler.isochron.result.title"),
			    items:[{
			    	xtype:"textfield"
			    }],
			    listeners:{
                	"collapse": function(){ win.syncShadow();},
                	"expand": function(){ win.syncShadow();}
                }
		    }]
		}],
		buttons:[{
			text: "Calculer"
		},{
			text: "Enregistrer"
		}]
	});
	
	return win;
};