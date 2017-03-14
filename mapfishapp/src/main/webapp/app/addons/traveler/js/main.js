Ext.namespace("GEOR.Addons");

GEOR.Addons.traveler = Ext.extend(GEOR.Addons.Base, {
    win: null,
    addressField: null,
    layer: null,

    /**
     * Method: init
     *
     * Parameters:
     * record - {Ext.data.record} a record with the addon parameters
     */
    init: function(record) {
    	var mainWindow;
    	var map, pointControlOptions, pointControl;
    	var layerAddon;
    	
    	var lastFsetUse;
    	var lastFieldUse;
    	
    	var vecStr = "vec_";
    	
    	var featureArray = new Object();
    	
    	
    	// get current map if exist -------------------------------------------
    	
        if (GeoExt.MapPanel.guess().map) {
            map = GeoExt.MapPanel.guess().map;
        }
        

        
        // Start layer creation -----------------------------------------------
        
        if(map){
        	if (map.getLayersByName("traveler_Layer").length == 1) {
                layerAddon = GeoExt.MapPanel.guess().map.getLayersByName("phob_layer_sbg")[0];
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
        
        // Start control creation -----------------------------------------------
        
        pointControlOptions = OpenLayers.Util.applyDefaults(
            this.pointControlOptions, {
                id: "traveler_point_ctrl"
            }
        );
            
        pointControl = new OpenLayers.Control.DrawFeature(layerAddon, OpenLayers.Handler.Point);
        
        pointControl.events.on({
            "featureadded": function() {
            	var str = "vec_";
            	
                pointControl.deactivate();
                var indx = layerAddon.features.length-1;
                var feature = layerAddon.features[indx];
                var lastPid = feature.id;
                var x = Math.round(feature.geometry.x * 10000) / 10000;
                var y = Math.round(feature.geometry.y * 10000) / 10000;
                
                featureArray[lastFsetUse] = lastPid;
                Ext.getCmp(lastFieldUse).setValue(x+" / "+y); 
            },
            scope: this
        });   
        
        
		map.addControl(pointControl);

        
        
        // Create points to input destination ----------------------------------
    	               
        // create new event fire when new way point is added
        var observable = new Ext.util.Observable();
        observable.addEvents( "addpoint" );    	 
    	        
        // function to create new wayPoint
    	var newPoint = function(isStart,delBtn){
    		 var addStr = "add_";
    		 var rmStr = "rm_";
    		 var gpsStr= "gps_";
    		 var inputStr = "field_";
    		 
    		 
        	// create element to contain waypoint's fields
    		var fSet =  new Ext.form.FieldSet({
    			width:250,
    			border:false,
    		});    	
    		
    		function removePoint(layer, id){
				// delete point if already exist
				if(featureArray[id] && featureArray[id] != ""){
					var point = layer.getFeatureById(featureArray[id]);
					layer.removeFeatures(point);
				}
    		}
    		
    		var addId = addStr + fSet.id;
    		var gpsId = gpsStr + fSet.id;
    		var rmId = rmStr + fSet.id;
    		var inputId = inputStr + fSet.id;

        	// create field and buttons
        	var banField = new Ext.form.CompositeField({
        			hideLabel: true,
        			items:[{
                		xtype:"combo",
                		id: inputId,
                		emptyText: "Adresse...",
                		hideLabel:true,
                		hideTrigger: true
                	},{
                		xtype:"button",                    		
                		iconCls:"gpsIcon",
                		id: gpsId,
                		cls:"actionBtn",
                		handler: function(button){
                			var idBtn = button.id;
                			// add point by click
                			if(pointControl && map){
                				if(!pointControl.active){                					
                					// active control
                					pointControl.activate();                					
                					lastFsetUse = button.id;
                					lastFieldUse = inputId;
                					removePoint(layerAddon, button.id);
                					
                					
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
        					observable.fireEvent("addPoint",observable);
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
                				if(mainWindow){
                					mainWindow.syncShadow();
                				}
                				// remove associated point
                				removePoint(layerAddon, gpsId);
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
        		hideLabel:true,
        		hidden:true
        	});
        	
        	// create text field
        	var combAtt = new Ext.form.TextField({
        		emptyText:"Objets...",
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
    	}    	
    	
    	
    	observable.on("addPoint", function(){
			if(Ext.getCmp("wayPointPanel")){
				var pan = Ext.getCmp("wayPointPanel");
				var idx = pan.items && pan.items.length ? pan.items.length - 1 : false;
				if(idx){    						  
					// add cross button to delete step
					pan.insert(idx,newPoint(true,false));
					// force refresh panel
					pan.doLayout();
					if(mainWindow){
						mainWindow.syncShadow();
						mainWindow.getId();
					}					
				}
			}    	
    	});
    	
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
    	
    	
    	var typeBox = new Ext.form.CompositeField({
    		cls:"typeBox",
    		items:[{
    			xtype:"checkbox",
    			boxLabel: "Le plus rapide"
    		},{
    			xtype:"checkbox",
    			boxLabel:"Le plus court"
    		}]
    	});    
    	
    	var searchPanel = new Ext.Panel({
        	autoScroll:true,
        	id:"wayPointPanel",
        	items:[modeBtn,typeBox],
        	margins:'3 0 3 3',
        	listeners:{
        		"added": function(panel){
    				panel.insert(1,newPoint(true, true));
        			panel.insert(2,newPoint(false, true));        			
        		}
        	}
        
    	});    	
    	    	
        // create main window containing free text combo
        this.win = new Ext.Window({
            title: OpenLayers.i18n("traveler.window_title"),
            constrainHeader:true,
            height:220,
            width:285,
            minWidth:280,
            autoScroll:true,
            closable: true,
            closeAction: "hide",
            resizable: true,
            collapsible:true,
            items:[searchPanel]
        });
        
        mainWindow = this.win;

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

