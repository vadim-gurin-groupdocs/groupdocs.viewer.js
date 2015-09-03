(function ($) {
    "use strict";
    
    if (!window.groupdocs)
        window.groupdocs = {};

    if (!window.Container) {
        window.Container = new JsInject.Container();
        Container.Register("Rx.Observable", function (c) { return Rx.Observable; }, true);
        Container.Register("RequestObservable", function (c) { return $.ajaxAsObservable; }, true);
        Container.Register("AsyncSubject", function (c) { return new Rx.AsyncSubject(); }, false);

        var host = window.location.hostname + (window.location.port ? ':' + window.location.port : '');
        var applicationPath = $.fn.groupdocsViewer && $.fn.groupdocsViewer.prototype.applicationPath;

        if (typeof applicationPath == "undefined" || applicationPath == "/") {
		    applicationPath = window.location.protocol + "//" + host+"/";
		    $.fn.groupdocsViewer.prototype.applicationPath = applicationPath;
	    }
        else {
    	    var slashPosition = applicationPath.indexOf("//");
    	    if (slashPosition == -1) {
    		    var newApplicationPath = window.location.protocol + "//" + host + applicationPath;
    		    $.fn.groupdocsViewer.prototype.applicationPath = newApplicationPath;
	        }

            var hostNamePosition = slashPosition + 2;
            if (applicationPath.indexOf(host, hostNamePosition) != hostNamePosition)
                $.fn.groupdocsViewer.prototype.isWorkingCrossDomain = true;
        }

        Container.Register("ServerExchange", function (c) {
                return new groupdocs.ServerExchange($.fn.groupdocsViewer.prototype.applicationPath,
                                                   $.fn.groupdocsViewer.prototype.useHttpHandlers,
                                                   $.fn.groupdocsViewer.prototype.isWorkingCrossDomain);
            }, true);
    }
})(jQuery);