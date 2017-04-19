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
            layer = new OpenLayers.Layer.Vector("iso_points", layerOptions);                
            map.addLayer(layer);
        }
    }
    return layer;	
};

GEOR.Addons.Traveler.isochrone.resultLayer = function(map){
	var from = new OpenLayers.Projection("EPSG:4326");
    var layer;       
    
    if (map) { // get layer if exist        	
        if (map.getLayersByName("iso_res").length > 0 && map.getLayersByName("iso_res")[0]) {
            layer = map.getLayersByName("iso_res")[0];
        } else { // or create layer
            var layerOptions = OpenLayers.Util.applyDefaults(
                this.layerOptions, {
                    displayInLayerSwitcher: false,
                    projection: map.getProjectionObject(),
                    preFeatureInsert: function(feature) {
                        feature.geometry.transform(from, map.getProjectionObject());
                    }
                }
            );            
            layer = new OpenLayers.Layer.Vector("iso_res", layerOptions);                
            map.addLayer(layer);
        }
    }
    return layer;	
};

/**
 * Créer ou appeler le controle permettant le dessin d'un point à main levée
 */
GEOR.Addons.Traveler.isochrone.drawControl = function(map, layer, obj, fId){
	var epsg4326 = new OpenLayers.Projection("EPSG:4326");
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
		                if (obj && feature.geometry) {
		                	// transform geom to 4326 and set combo value in 3857
		                	var locGeom  =  new OpenLayers.Geometry.Point(feature.geometry.x, feature.geometry.y).transform(map.getProjection(),epsg4326);
		                    obj["location"] = locGeom.x+","+locGeom.y;
		                    // display text field
		                    Ext.getCmp(fId).setValue(x + "/" + y);
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

GEOR.Addons.Traveler.isochrone.time = function(addon){
	if(Ext.getCmp("iso_time")){
		Ext.getCmp("iso_time").destroy();
	}
	var config = addon.options;
	return new Ext.form.CompositeField({
		id: "iso_time",
		hideLabel: true,
		items:[{
			xtype:"numberfield",
			value:config.TIME[0],
			width: 30
		},{
			xtype:"textfield",
			value: "min",
			width: 25,
			cls: "time-field",
			readOnly: true
		},{
			xtype:"numberfield",
			value:config.TIME[1],
			emptyText:"0",
			width: 30
		},{
			xtype:"textfield",
			width: 25,
			cls: "time-field",
			value: "min",
			readOnly: true
		},{
			xtype:"numberfield",
			value:config.TIME[2],
			emptyText:"0",
			width: 30
		},{
			xtype:"textfield",
			width: 25,
			cls: "time-field",
			value: "min",
			readOnly: true
		}]
	});
};

/**
 * Créer les boutons pour séléctionner le mode de déplacement
 */
GEOR.Addons.Traveler.isochrone.mode = function(){
	if(Ext.getCmp("iso_modeCp")){
		Ext.getCmp("iso_modeCp").destroy();
	}
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
			iconCls: "vehicle-pressed",
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
	if(Ext.getCmp("iso_exclusions")){
		Ext.getCmp("iso_exclusions").destroy();
	}
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
GEOR.Addons.Traveler.isochrone.ban = function(map,layer, service, startPoints){
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
	if(Ext.getCmp("iso_ban")){
		Ext.getCmp("iso_ban").destroy();
	}
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
                    
                    if(startPoints){
                    	startPoints["location"] = geom.x +","+ geom.y;
                    }
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
	if(Ext.getCmp("iso_geom")){
		Ext.getCmp("iso_geom").destroy();
	}
    return new Ext.form.Checkbox({
        hideLabel: true,
        id:"iso_geom",
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
GEOR.Addons.Traveler.isochrone.pointFset = function(addon, ban, layer){
	var items = [];
	if(Ext.getCmp("iso_input")){
		Ext.getCmp("iso_input").destroy();
	}
	var fields = new Ext.form.FieldSet({
        autoWidht: true,
        hideLabel:true,
        cls: "fsStep",
        id: "iso_input",
        items:[ban]
    });	
	
	var comboRef =  GEOR.Addons.Traveler.referential.create(addon, fields, layer);
	
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
    	if(Ext.getCmp("iso_cpfCheck")){
    		Ext.getCmp("iso_cpfCheck").destroy();
    	}
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
 * 		- table : object clé valeur
 * 		- isochrones : géométries crées
 * 
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
		table[cpf.id] = len;
	}
};

GEOR.Addons.Traveler.isochrone.createIsochrone = function(addon){
	
	addon.isoResLayer.removeAllFeatures();
	
	var config = addon.options;
	var settings = {};	
	var check = [];
	
	settings.srs = config.ISO_SRS;
	settings.smoothing = config.SMOOTHING;
	settings.holes = config.HOLES;	
	
	var service = config.ISOCHRONE_SERVICE;
	
	var obj = addon.isoStart;
	var layer = addon.isoResLayer;
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
    if(Ext.getCmp("iso_geom").checked){ 	// get geom from browser if checked
    	
    } else {
    	if(obj){ // get geom from ban or referential tools
    		settings.location = obj["location"];
    	}
    }    
    var isochrones = [];
    var times = [];
    
    if(Ext.getCmp("iso_time")){    	
    	// get times values
    	var li = Ext.getCmp("iso_time").items.items;
    	li.forEach(function(el){
    		if(el.xtype == "numberfield" && (el.getValue() > 0 || el.getValue() !=="")){
    			var seconds = el.getValue() * 60;
    			times.push(seconds);    			    			   
    		}
    	}); 	    	
    	
    	// fire request
    	var area = [];
    	var id = "";
    	times.forEach(function(el, index){
    		settings.time = el;
    		if(settings.time && settings.location){
        		OpenLayers.Request.GET({
        			url: service,
        			params: settings,
        			callback: function(request){
        				if(request.responseText){
        					// get geom from JSON decode
        					var decode = JSON.parse(request.responseText);
        					var geom = decode.wktGeometry;
        					var wkt = new OpenLayers.Format.WKT();
        					var feature = wkt.read(geom);       
        					// set style
        					feature.style = new OpenLayers.Style();
    						feature.style.strokeColor = config.ISOCHRONE_STROKE ? config.ISOCHRONE_STROKE : "rgba(255,255,255,0.4)";       						        					
        					// compare area to display feature in good order
    						isochrones.push(feature);
        					area.push(feature.geometry.getArea());
        					if(isochrones.length == times.length){        											
        						var areaMax = Math.max.apply(Math, area);
        						var areaMin = Math.min.apply(Math, area);
        						var order = [];
        						// insert isochrone to array in order with good style
        						function setPos (feature,pos, color){    								
    								feature.style.fillColor = config.ISOCHRONES_COLOR[color];
    								feature.style.graphicZIndex = pos;
    								order[pos]=feature;
        						}        			        						
        						isochrones.forEach(function(feature){        						
        							var measure = feature.geometry.getArea();
        							if(measure == areaMax){  
        								setPos(feature, 0,2);
        								var extent = feature;
    								}
        							else if(measure ==  areaMin){ setPos(feature, 2,0); }
        							else{ setPos(feature, 1,1); }
        						});        						
        						// wait process finish totaly
        						setTimeout(function(){
        							order.forEach(function(el){
        								if(el && el.geometry){
        									addon.isoResLayer.addFeatures(el);
        								}
        							});
        						}, 2000);        						
        					}
        				}
        			}
        		});
        		        		
    		} else {
    			Ext.Msg.alert(OpenLayers.i18n("isochrone.title.failrequest"), OpenLayers.i18n("isochrone.message.failrequest"));
    		}
    	});
    }
}; 

/**
 * Method: storeGeometry
 * Aggregates isochrones features' geometries and stores it in LocalStorage
 * for later use in querier.
 */
GEOR.Addons.Traveler.isochrone.storeGeometry = function(features){	
    // compute aggregation of geometries
	if(features || features.length > 0){
        components = [], type;
        Ext.each(features, function(feature) {
            if (/OpenLayers\.Geometry\.Multi.*/.test(feature.geometry.CLASS_NAME)) {
                // multi-geometry
                Ext.each(feature.geometry.components, function(cmp) {
                    // check that we are not adding pears with bananas
                    if (!type) {
                        type = cmp.CLASS_NAME;
                        components.push(cmp.clone());
                    } else if (cmp.CLASS_NAME == type){
                        components.push(cmp.clone());
                    }
                });
            } else {
                // simple geometry
                if (!type) {
                    type = feature.geometry.CLASS_NAME;
                    components.push(feature.geometry.clone());
                } else if (feature.geometry.CLASS_NAME == type){
                    components.push(feature.geometry.clone());
                }
            }
        });
        // store the geometry for later use
        var singleType = type.substr(type.lastIndexOf('.')+1),
            geometry = new OpenLayers.Geometry["Multi"+singleType](components);
        if(Ext.state.Manager.getProvider()){
        	var provider = Ext.state.Manager.getProvider();
            provider.set('geometry',
                provider.encodeValue(geometry.toString())
            );
            GEOR.util.infoDialog({
                msg: OpenLayers.i18n("Geometry successfully stored in this browser")
            });
        }        
	}	
} ;

/**
 *  Création de la fenêtre de l'outil
 */
GEOR.Addons.Traveler.isochrone.window = function(mode, fSet, exclusion, addon, timeFields){
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
                //hideLabel:true,
                fieldLabel: "isochrones",
                cls: "fsStep",
                id: "iso_timeFset",
                items: [timeFields]
			},{            
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
			text: "Calculer",
			listeners:{
				"click": function(b){
					GEOR.Addons.Traveler.isochrone.createIsochrone(addon);
				}
			}
		},{
			text: "Enregistrer",
			listeners:{
				click: function(b){
					// get isochrones geom and store 
					GEOR.Addons.Traveler.isochrone.storeGeometry(features);
				}
			}
		}]
	});
	
	return win;
};