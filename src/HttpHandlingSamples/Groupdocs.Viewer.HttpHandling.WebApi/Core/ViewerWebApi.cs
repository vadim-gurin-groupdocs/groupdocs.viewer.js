using System;
using System.Web.Http;
using Groupdocs.Viewer.HttpHandling.WebApi.Controllers;
using StructureMap;
using Groupdocs.Viewer.HttpHandling.WebApi.DependencyResolution;

namespace Groupdocs.Viewer.HttpHandling.WebApi.Core
{
    /// <summary>
    /// Viewer global settings
    /// </summary>
    public static class ViewerWebApi
    {
        /// <summary>
        /// Initializes the ASP.NET MVC routes used by Viewer.
        /// </summary>
        public static void InitRoutes(HttpConfiguration config)
        {
            GroupdocsViewerApiController controller = new GroupdocsViewerApiController();
            HttpRouteCollection routes = config.Routes;
            if (routes == null)
            {
                throw new InvalidOperationException("Cannot obtain 'Routes' collection");
            }

            routes.MapHttpRoute(
              "fonts",
              "document-viewer/fonts/{name}",
              new { controller = "GroupdocsViewer", action = "GetFont" }
              );

            routes.MapHttpRoute(
              "images",
              "document-viewer/images/{name}",
              new { controller = "GroupdocsViewer", action = "GetEmbeddedImage" }
              );

            routes.MapHttpRoute(
               "genericRoute",
               "document-viewer/{action}",
               new { controller = "GroupdocsViewerApi" }
               );
        }

        public static void InitDependencyInjection()
        {
            //IContainer container = IoC.Initialize();
            //StructureMapDependencyScope = new StructureMapDependencyScope(container);
            //DependencyResolver.SetResolver(StructureMapDependencyScope);
            //DynamicModuleUtility.RegisterModule(typeof(StructureMapScopeModule));
            //return container;
        }
    }
}
