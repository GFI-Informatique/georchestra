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

    	
    	// create first field set
    	var dataRadio = function(){
    		return new Ext.form.CompositeField({
        		xtype: "compositefield",
        		fieldLabel:"Rechercher ",
        		anchor:"100%",
        		defaults: {
        			flex:1
        		},
        		items:[{
        			xtype:"radio",
        			boxLabel:"un lieu",
        			anchor:"50%",
        			name:"data"
        		},{
        			xtype:"radio",
        			boxLabel:"une référence",
        			anchor:"50%",
        			name:"data"
        		}]
    		})
    	};


    	
        // create main window containing free text combo
        this.win = new Ext.Window({
            title: OpenLayers.i18n("traveler.window_title"),
            constrainHeader:true,
            width: 312,
            autoHeight:true,
            closable: true,
            closeAction: "hide",
            resizable: true,
            collapsible:true,
            buttons: [{
                text:"Fermer"        		
            }],
            items:[{
            	xtype:"panel",
            	items:[{
            		xtype:"compositefield",
            		anchor:"100%",
            		height: 40,
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
                	}]
            	}]
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

