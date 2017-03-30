Ext.namespace("GEOR.Addons");

GEOR.Addons.Annotation = Ext.extend(GEOR.Addons.Base, {

    window: null,

    /**
     * Method: init
     *
     * Parameters:
     * record - {Ext.data.record} a record with the addon parameters
     */
    init: function(record) {

    	function upLayer (){
            if(GeoExt.MapPanel.guess().map.getLayersByName("__georchestra_annotations")){
                GeoExt.MapPanel.guess().map.getLayersByName("__georchestra_annotations")[0].setZIndex(1000);
			}
    	}
        GEOR.wmc.events.on("aftercontextrestore", function(){
        	upLayer();
        });            	
    	
        GEOR.layerfinder.events.on("layeradded", function(){
        	upLayer();
        });
        
        GEOR.managelayers.events.on("layerremoved", function(){
        	upLayer();
        });
        
        var annotation = new GEOR.Annotation({
            map: this.map,
            popupOptions: {unpinnable: false, draggable: true}
        });
        this.window = new Ext.Window({
            title: OpenLayers.i18n('annotation.drawing_tools'),
            id: "annotation_mainWindow",
            width: 510,
            constrainHeader:true,
            closable: true,
            closeAction: "hide",
            resizable: false,
            border: false,
            cls: 'annotation',
            items: [{
                xtype: 'toolbar',
                border: false,
                items: annotation.actions
            }],
            listeners: {
                "hide": function() {
                    this.item && this.item.setChecked(false);
                    this.components && this.components.toggle(false);
                    // close XY window if open and user close annotation menu
                    if (Ext.getCmp('winXyId')){
                		Ext.getCmp('winXyId').destroy();
                		Ext.getCmp('DrawXyButtonId').toggle(false);
                	}
                },
                scope: this
            }
        });
  
        if (this.target) {
            // create a button to be inserted in toolbar:
            this.components = this.target.insertButton(this.position, {
                xtype: 'button',
                tooltip: this.getTooltip(record),
                iconCls: "addon-annotation",
                handler: this._onCheckchange,
                scope: this
            });
            this.target.doLayout();
        } else {
            // create a menu item for the "tools" menu:
            this.item =  new Ext.menu.CheckItem({
                text: this.getText(record),
                qtip: this.getQtip(record),
                iconCls: "addon-annotation",
                checked: false,
                listeners: {
                    "checkchange": this._onCheckchange,
                    scope: this
                }
            });
        }
    },

    /**
     * Method: _onCheckchange
     * Callback on checkbox state changed
     */
    _onCheckchange: function(item, checked) {
        if (checked) {
            this.window.show();
            this.window.alignTo(
                Ext.get(this.map.div),
                "t-t",
                [0, 5],
                true
            );
        } else {
            this.window.hide();
        }
    },

    /**
     * Method: destroy
     * Called by GEOR_tools when deselecting this addon
     */
    destroy: function() {
        this.window.hide();

        GEOR.Addons.Base.prototype.destroy.call(this);
    }
});
