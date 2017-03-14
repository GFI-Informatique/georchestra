Ext.namespace("GEOR.Addons");

GEOR.Addons.traveler = Ext.extend(GEOR.Addons.Base, {
    win: null,
    addressField: null,
    
    featureArray: new Object(),    
    
    /**
     * Method: map
     * get current map
     *     
     */
    map: function(){
        if (GeoExt.MapPanel.guess().map) {
            return GeoExt.MapPanel.guess().map
        }        
    },
    
    
    /**
     * Method: layer
     * create point layer
     *     
     */    
    layer: function(){
    	var layerAddon;
    	var map = this.map;
    	if(map){
    		// create and add layer to map if not exist
        	if (map.getLayersByName("traveler_Layer").length == 1) {
                layerAddon = GeoExt.MapPanel.guess().map.getLayersByName("traveler_Layer")[0];
            } else {
            	var layerOptions = OpenLayers.Util.applyDefaults(
                    this.layerOptions, {
                        displayInLayerSwitcher: false,
                        projection: map.getProjectionObject(),
                    }
                );                
                layerAddon = new OpenLayers.Layer.Vector("traveler_Layer", layerOptions);                                
                map.addLayer(layerAddon);                                
            }
        }      
    	return layerAddon;
    },
    
    
    
    /**
     * Method: addDrawControl
     * create control to draw point by click if not exist
     *     
     */
    
    drawControl: function(){
    	
    	var controlOptions;
    	
    	var control = this.map.getControlsBy("id","traveler_point_ctrl").length == 1 ? this.map.getControlsBy("id","traveler_point_ctrl")[0] : false;
    	var layer = this.layer();
    	var map = this.map;
    	var featureArray = this.featureArray;
    	
    	// if control not exist create and add it
    	if(map && layer && !control){
            controlOptions = OpenLayers.Util.applyDefaults(
                this.pointControlOptions, {
                    id: "traveler_point_ctrl"
                }
            );
                
            control = new OpenLayers.Control.DrawFeature(layer, OpenLayers.Handler.Point, controlOptions);
            
            control.events.on({
                "featureadded": function() {
                	var str = "vec_";
                	
                	control.deactivate();
                	
                    var indx = layer.features.length-1;
                    var feature = layer.features[indx];
                    var lastPid = feature.id;
                    var x = Math.round(feature.geometry.x * 10000) / 10000;
                    var y = Math.round(feature.geometry.y * 10000) / 10000;
                    
                    featureArray[lastFsetUse] = lastPid;
                    Ext.getCmp(lastFieldUse).setValue(x+" / "+y); 
                },
                scope: this
            });   
            
            
            // add control
            map.addControl(control);    		
    	}
    	
    	// return control
    	return control;
    },
    
    /**
     * Method: addStep
     *Add new step on route
     *
     * Parameters:
     * isStart - {boolean} true or false to set start point
     * delBtn  - {boolean} true or false to display cross icon
     */
    
    addStep : function(isStart,delBtn){
		 var addStr = "add_";
		 var rmStr = "rm_";
		 var gpsStr= "gps_";
		 var inputStr = "field_";	 
		 		 
		 var travelerAddon = this;
		 var layer = this.layer();
		 var featureArray = this.featureArray;
		 
		 if(this.win){
			 var window = this.win;
		 }
		 
		 if(this.panel){
			 var panel = this.panel;
		 }		 
		 
		 var map = this.map;
		 
		 var banStore = new Ext.data.JsonStore({
             proxy: new Ext.data.HttpProxy({
                 url:"https://api-adresse.data.gouv.fr/search/?", // set service URL in config.json file, more informations in README
                 method: 'GET',
                 autoLoad:true
             }),
             root:'features',
             fields:[                    
                     {name:'typeGeometry',
                      convert:function(v,rec){
                          return rec.geometry.type
                      }
                     },
                     {name:'coordinates',
                      convert:function(v,rec){
                          return rec.geometry.coordinates
                      }
                     },
                     {name:'id',
                      convert:function(v,rec){
                          return rec.properties.id
                      }
                     },
                     {name:'label',
                      convert:function(v,rec){
                          return rec.properties.label
                      }
                     }                                              
                    ],
            totalProperty: 'limit',
            listeners : {
                "beforeload": function (q){
                	banStore.baseParams.q = store.baseParams["query"];  
                	banStore.baseParams.limit = 5;   // number of result is default set to 5, change it in config.json file, more informations in README
                    delete banStore.baseParams["query"];
                }
            }
		 });
		 
		 
    	// create element to contain waypoint's fields
		var fSet =  new Ext.form.FieldSet({
			width:250,
			border:false,
		});
		
		// create ID from fSet
		var addId = addStr + fSet.id;
		var gpsId = gpsStr + fSet.id;
		var rmId = rmStr + fSet.id;
		var inputId = inputStr + fSet.id;
		    		
		function removePoint(layer, id, arr){
						
			// delete point if already exist
			if(arr[id] && arr[id] != ""){
				var point = layer.getFeatureById(arr[id]);
				layer.removeFeatures(point);
			}
		}
		
    	// create field and buttons
    	var banField = new Ext.form.CompositeField({
    			hideLabel: true,
    			anchor:"90%",
    			items:[{
            		xtype:"combo",
            		id: inputId,
            		anchor:200,
            		emptyText: "Adresse...",
            		hideLabel:true,
            		hideTrigger: true,
            		store:banStore,
                    displayField:'label',                        
                    hideTrigger: true,
                    pageSize:0,
                    minChars: 5
            	},{
            		xtype:"button",                    		
            		iconCls:"gpsIcon",
            		id: gpsId,
            		cls:"actionBtn",
            		handler: function(button){
            			var idBtn = button.id;
            			var pointControl = travelerAddon.drawControl();
            			// add point by click
            			if(pointControl && map){
            				if(!pointControl.active){                					
            					// active control
            					pointControl.activate();                					
            					lastFsetUse = button.id;
            					lastFieldUse = inputId;
            					removePoint(layer, button.id, featureArray);
            					
            					
            					// create or reset key value in association table
            					featureArray[fSet.id] = "";
            				} else {
            					pointControl.deactivate();
            				}                				
            			}
            		}
            	},{
            		xtype:"button",
            		iconCls:"addIcon",
            		id: addId,
            		cls:"actionBtn",
            		hidden: isStart,
        			handler: function(){
    					//observable.fireEvent("addPoint",observable);
        				travelerAddon.insertFset(panel, window);
        			},
        			listeners:{
            			"mouseover":function(){
            				if(!this.pressed){
            					this.setIconClass("addHover");
            				}                				
            			},"mouseout": function(){
            				if(!this.pressed){
            					this.setIconClass("addIcon");
            				}                				
            			}                		
            		}
            	},{
            		xtype:"button",
            		iconCls:"rmIcon",
            		id: rmId,
            		hidden: delBtn,
            		cls: "actionBtn",
            		handler: function(button){
            			if(fSet){                				
            				fSet.destroy();
            				if(window){
            					window.syncShadow();
            				}
            				// remove associated point
            				removePoint(layerAddon, gpsId, featureArray);
            				featureArray[gpsId] = "";
            			}               			                			
            		},
            		listeners:{
            			"mouseover":function(){
            				if(!this.pressed){
            					this.setIconClass("rmHover");
            				}                				
            			},"mouseout": function(){
            				if(!this.pressed){
            					this.setIconClass("rmIcon");
            				}                				
            			}                		
            		}
            	}]
		});      	
    	
    	// create combo to select type of data
    	var comboRef = new Ext.form.ComboBox({
    		emptyText:"Couches...",
    		anchor:"75%",
    		hideLabel:true,
    		hidden:true
    	});
    	
    	// create text field
    	var combAtt = new Ext.form.TextField({
    		emptyText:"Objets...",
    		anchor:"75%",
    		hideLabel:true,
    		hidden:true
    	});
    	
    	// add all items to field set
    	fSet.add(banField);
    	fSet.add(comboRef);
    	fSet.add(combAtt);
		
		//create checkitem
    	var checkItem = new Ext.form.Checkbox({
			hideLabel:true,
    		boxLabel: "Référentiels",
			listeners:{
				"check": function(){
					if(this.checked){
						banField.hide();
						comboRef.show();
						combAtt.show();
					} else {
						banField.show();
						comboRef.hide();
						combAtt.hide();
					}
				}
			}
		});  
    	
    	// insert checkbox to select data type
    	fSet.insert(0, checkItem);
    	
		
		return fSet;
	},
	
    /**
     * Method: init
     *
     * Parameters:
     * panel - {Ext.form.Panel} panel to contain field and search options
     * window - {Ext.form.Window} main window use to calculate route
     * method - {function} addon method to add new fieldSet
     */
	insertFset : function (panel, window){
		
		var addonTraveler = this;
		
		if(panel){
			var idx = panel.items && panel.items.length > 3 ? panel.items.length - 2 : false;
			if(idx){    						  
			// add cross button to delete step
			panel.insert(idx,addonTraveler.addStep(false,false));
			// force refresh panel
			panel.doLayout();
			if(window){
				window.syncShadow();
				window.getId();
			}			
			}
		}    	   	    		
	},

    /**
     * Method: init
     *
     * Parameters:
     * record - {Ext.data.record} a record with the addon parameters
     */
    init: function(record) {    	
    	
    	var layerAddon = this.layer();
    	    	    	
    	var featureArray = this.featureArray;    	    
    	
    	var travelerAddon = this;
    	    	
    	// create control to draw point
    	this.drawControl();    	    	         	             
    	    	
		// create buttons to select type of transport
    	var modeBtn = new Ext.form.CompositeField({
    		 // first window's panel
    		anchor:"100%",
        	items:[{
        		xtype:"button",
        		height:35,
        		id:"walkBtn",
        		width:35,
        		enableToggle:true,
        		toggleGroup:"modeBtn",
        		iconCls:"walkBtn",
        		cls:"walkStyle",
        		listeners:{
        			"mouseover":function(){
        				if(!this.pressed){
        					this.setIconClass("walk-over");
        				}                				
        			},"mouseout": function(){
        				if(!this.pressed){
        					this.setIconClass("walkBtn");
        				}                				
        			},"toggle":function(){
        				if(this.pressed){
        					this.setIconClass("walk-pressed");
        				}else{
        					this.setIconClass("walkBtn");
        				}
        			}
        		}
        	},{
        		xtype:"button",
        		iconCls:"carBtn",
        		id:"carBtn",
        		enableToggle:true,
        		height:35,
        		toggleGroup:"modeBtn",
        		width:35,
        		cls:"carStyle",
        		listeners:{
        			"mouseover":function(){
        				if(!this.pressed){
        					this.setIconClass("car-over");
        				}                				
        			},"mouseout": function(){
        				if(!this.pressed){
        					this.setIconClass("carBtn");
        				}                				
        			},"toggle":function(){
        				if(this.pressed){
        					this.setIconClass("car-pressed");
        				}else{
        					this.setIconClass("carBtn");
        				}
        			}
        		}
        	},{
        		xtype: "spacer",
        		width:"30"
        	}]
    	});
    	
    	
    	this.panel = new Ext.Panel({
        	autoScroll:true,
        	anchor:"100%",
        	id:"wayPointPanel",
        	items:[modeBtn,{
        		xtype: "compositefield",
        		cls: "typeBox",
        		items:[{
	    			xtype:"radio",
	    			name:"typeRadio",
	    			checked:true,
	    			baseCls:"checkStyle",
	    			boxLabel: "Le plus rapide"
	    		},{
	    			xtype:"radio",
	    			name:"typeRadio",
	    			cls:"uncheckStyle",
	    			boxLabel:"Le plus court"
	    		},{
	    			xtype:"spacer",
	    			width: "20"
	    		},{
	    			xtype:"button",
	    			text:"Plus d'options",
	    			cls:"actionBtn"
	    		}]
        	}],
        	listeners:{
        		"added": function(panel){
    				panel.insert(1,travelerAddon.addStep(true, true));
        			panel.insert(2,travelerAddon.addStep(false, true));        			
        		}
        	}
        
    	});
    	
    	    	
        // create main window containing free text combo
        this.win = new Ext.Window({
            title: OpenLayers.i18n("traveler.window_title"),
            constrainHeader:true,
            height:300,            
            width:300,
            autoScroll:true,
            closable: true,
            closeAction: "hide",
            resizable: true,
            collapsible:true,
            items:[this.panel],
            listeners:{
            	"hide": function(){
            		// remove all features
            		if(layerAddon){            			
            			layerAddon.removeAllFeatures();
            		}
            	}
            }
        });
        

        if (this.target) {
            // create a button to be inserted in toolbar:
            this.components = this.target.insertButton(this.position, {
                xtype: "button",
                tooltip: "tooltip",
                iconCls: "addon-traveler",
                handler: function(){
                	this.win.show();
                },
                scope: this
            });
            this.target.doLayout();
        } else {
            // create a menu item for the "tools" menu:
            this.item =  new Ext.menu.CheckItem({
                text: this.getText(record),
                qtip: this.getQtip(record),
                iconCls: "addon-traveler",
                handler: function(){
                	this.win.show();
                },
                scope: this
            });
        }
    },


    
    /**
     * Method: destroy
     * Called by GEOR_tools when deselecting this addon
     */
    destroy: function() {
        this.win.destroy();
        
        GEOR.Addons.Base.prototype.destroy.call(this);
    }
});

