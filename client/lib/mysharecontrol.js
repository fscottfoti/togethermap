// jshint ignore: start

/* this a copy of the mapbox share control with edits to use the right url */

MyShareControl = L.Control.extend({
    includes: [],

    options: {
        position: 'topleft',
        url: ''
    },

    initialize: function(_, options) {
        L.setOptions(this, options);
    },

    onAdd: function(map) {
        this._map = map;

        var container = L.DomUtil.create('div', 'leaflet-control-mapbox-share leaflet-bar');
        var link = L.DomUtil.create('a', 'mapbox-share mapbox-icon mapbox-icon-share', container);
        link.href = '#';

        this._modal = L.DomUtil.create('div', 'mapbox-modal', this._map._container);
        this._mask = L.DomUtil.create('div', 'mapbox-modal-mask', this._modal);
        this._content = L.DomUtil.create('div', 'mapbox-modal-content', this._modal);

        L.DomEvent.addListener(link, 'click', this._shareClick, this);
        L.DomEvent.disableClickPropagation(container);

        this._map.on('mousedown', this._clickOut, this);

        return container;
    },

    _clickOut: function(e) {
        if (this._sharing) {
            L.DomEvent.preventDefault(e);
            L.DomUtil.removeClass(this._modal, 'active');
            this._content.innerHTML = '';
            this._sharing = null;
            return;
        }
    },

    _shareClick: function(e) {
        L.DomEvent.stop(e);
        if (this._sharing) return this._clickOut(e);

        var obj = this.link_f(),
            url = obj.url,
            image = obj.image,
            name = obj.name;

        var embed = url,
            enc_url = encodeURIComponent(url),
            enc_name = encodeURIComponent(name),
            enc_image = encodeURIComponent(image),
            twitter = '//twitter.com/intent/tweet?status=' + enc_name + ' ' + enc_url,
            facebook = '//www.facebook.com/sharer.php?u=' + enc_url + '&t=' + enc_name,
            pinterest = '//www.pinterest.com/pin/create/button/?url=' + enc_url + '&media=' + enc_image + '&description=' + enc_name,
            share = ("<h3>Share this map</h3>" +
            "<div class='mapbox-share-buttons'><a class='mapbox-button mapbox-button-icon mapbox-icon-facebook' target='_blank' href='{{facebook}}'>Facebook</a>" +
            "<a class='mapbox-button mapbox-button-icon mapbox-icon-twitter' target='_blank' href='{{twitter}}'>Twitter</a>" +
            "<a class='mapbox-button mapbox-button-icon mapbox-icon-pinterest' target='_blank' href='{{pinterest}}'>Pinterest</a></div>")
                .replace('{{twitter}}', twitter)
                .replace('{{facebook}}', facebook)
                .replace('{{pinterest}}', pinterest),
            embedValue = '<iframe width="100%" height="500px" frameBorder="0" src="{{embed}}"></iframe>'.replace('{{embed}}', embed),
            embedLabel = 'Copy and paste this <strong>HTML code</strong> into documents to embed this map on web pages.';

        L.DomUtil.addClass(this._modal, 'active');

        this._sharing = L.DomUtil.create('div', 'mapbox-modal-body', this._content);
        this._sharing.innerHTML = share;

        var input = L.DomUtil.create('input', 'mapbox-embed', this._sharing);
        input.type = 'text';
        input.value = embedValue;

        var label = L.DomUtil.create('label', 'mapbox-embed-description', this._sharing);
        label.innerHTML = embedLabel;
        
        var input2 = L.DomUtil.create('input', 'mapbox-embed', this._sharing);
        input2.type = 'text';
        input2.value = url;

        var label2 = L.DomUtil.create('label', 'mapbox-embed-description', this._sharing);
        label2.innerHTML = "Or just copy and paste this link and send it to friends";

        var close = L.DomUtil.create('a', 'leaflet-popup-close-button', this._sharing);
        close.href = '#';

        L.DomEvent.disableClickPropagation(this._sharing);
        L.DomEvent.addListener(close, 'click', this._clickOut, this);
        L.DomEvent.addListener(input, 'click', function(e) {
            e.target.focus();
            e.target.select();
        });
        
        L.DomEvent.addListener(input2, 'click', function(e) {
            e.target.focus();
            e.target.select();
        });
    }
});
