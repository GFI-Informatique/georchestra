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
    	
    	var newPoint = function(isStart){
    		
        	// create field and buttons
        	var banField = new Ext.form.CompositeField({
        			hideLabel: true,
        			anchor:"100%",
        			items:[{
                		xtype:"textfield",
                		anchor:"70%",
                		hideLabel:true                			
                	},{
                		xtype:"button",                    		
                		iconCls:"gpsIcon",
                		cls:"actionBtn"                   	                    			
                	},{
                		xtype:"button",
                		iconCls:"addIcon",
                		cls:"actionBtn",
                		hidden: isStart,
            			handler: function(){
            				if(Ext.getCmp("hideBtn")){
            					var btn = Ext.getCmp("hideBtn");
            					btn.fireEvent("click",btn);

            				}
            			}
                	}]
    		});    		    	
        	
        	var comboRef = new Ext.form.ComboBox({
        		emptyText:"Couches...",
        		anchor:"70%",
        		hideLabel:true,
        		hidden:true
        	});
        	
        	var combAtt = new Ext.form.TextField({
        		emptyText:"Objets...",
        		anchor:"70%",
        		hideLabel:true,
        		hidden:true
        	});
        	
    		var fSet =  new Ext.form.FieldSet({
    			anchor:"100%",
    			border:false,
    			items:[banField, comboRef, combAtt]
    		});	    	
    		
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
        	
        	fSet.insert(0, checkItem);
        	
    		
    		return fSet;
    	}
    	
    	var hiddenbtn = new Ext.Button({
    		hidden:true,
    		id:"hideBtn",
    		listeners: {
    			"click": function(){
    				if(Ext.getCmp("wayPointPanel")){
    					var pan = Ext.getCmp("wayPointPanel");
    					var idx = pan.items && pan.items.length ? pan.items.length - 1 : false;
    					if(idx){    						    					
    						pan.insert(idx,newPoint(true));
    						// now, add cross button to delete step
    						pan.doLayout();
    					}
    				}
    			}
    		}
    	})

    	
        // create main window containing free text combo
        this.win = new Ext.Window({
            title: OpenLayers.i18n("traveler.window_title"),
            constrainHeader:true,
            autoScroll:true,
            width: 200,
            height:200,
            closable: true,
            closeAction: "hide",
            resizable: true,
            collapsible:true,
            items:[{ // first window's panel
            	xtype:"panel",
            	items:[{
            		xtype:"compositefield",
            		anchor:"100%",
            		height: 35,
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
            	}]
            },{ // second window's panel
            	xtype:"panel",
            	id:"wayPointPanel",
            	listeners:{
            		"added": function(panel){
            			if(!panel.items){
            				panel.insert(0,newPoint(true));
                			panel.insert(1,newPoint(false));
            			}
            			
            		}
            	}
            }]
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

