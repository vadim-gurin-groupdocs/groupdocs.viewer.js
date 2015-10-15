using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Web.Http;
using Groupdocs.Viewer.HttpHandling.WebApi.Controllers;
using Groupdocs.Viewer.HttpHandling.WebApi.Core;
using Microsoft.Owin.Security.OAuth;
using Newtonsoft.Json.Serialization;

namespace GroupdocsViewer.EngineeringSample.Net4_5_1
{
    public static class WebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {
            // Web API configuration and services
            // Configure Web API to use only bearer token authentication.
            config.SuppressDefaultHostAuthentication();
            config.Filters.Add(new HostAuthenticationFilter(OAuthDefaults.AuthenticationType));

            // Web API routes
            config.MapHttpAttributeRoutes();
            //GroupdocsViewerController controller = new GroupdocsViewerController();
            ViewerWebApi.InitRoutes(config);

            config.Routes.MapHttpRoute(
                name: "DefaultApi",
                routeTemplate: "api/{controller}/{id}",
                defaults: new { id = RouteParameter.Optional }
            );
        }
    }
}
