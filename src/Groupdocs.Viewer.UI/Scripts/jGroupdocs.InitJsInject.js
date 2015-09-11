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
        if (!window.groupdocs.viewer)
            window.groupdocs.viewer = {};
        var applicationPath = window.groupdocs.viewer && window.groupdocs.viewer.applicationPath;

        if (typeof applicationPath == "undefined" || applicationPath == "/") {
		    applicationPath = window.location.protocol + "//" + host+"/";
		    window.groupdocs.viewer.applicationPath = applicationPath;
	    }
        else {
    	    var slashPosition = applicationPath.indexOf("//");
    	    if (slashPosition == -1) {
    		    var newApplicationPath = window.location.protocol + "//" + host + applicationPath;
    		    window.groupdocs.viewer.applicationPath = newApplicationPath;
	        }

            var hostNamePosition = slashPosition + 2;
            if (applicationPath.indexOf(host, hostNamePosition) != hostNamePosition)
                window.groupdocs.viewer.isWorkingCrossDomain = true;
        }

        Container.Register("ServerExchange", function (c) {
            return new groupdocs.ServerExchange(window.groupdocs.viewer.applicationPath,
                                                window.groupdocs.viewer.useHttpHandlers,
                                                window.groupdocs.viewer.isWorkingCrossDomain);
            }, true);
    }
})(jQuery);