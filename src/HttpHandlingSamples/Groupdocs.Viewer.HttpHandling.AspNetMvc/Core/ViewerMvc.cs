using System;
using System.Web.Mvc;
using System.Web.Routing;
using Groupdocs.Viewer.HttpHandling.AspNetMvc.DependencyResolution;
using StructureMap;

namespace Groupdocs.Viewer.HttpHandling.AspNetMvc.Core
{
    /// <summary>
    /// Viewer global settings
    /// </summary>
    public static class ViewerMvc
    {
        /// <summary>
        /// Initializes the ASP.NET MVC routes used by Viewer.
        /// </summary>
        public static void InitRoutes()
        {
            RouteCollection routes = RouteTable.Routes;
            if (routes == null)
            {
                throw new InvalidOperationException("Cannot obtain 'RouteTable.Routes' collection");
            }

            routes.MapRoute(
              null,
              "document-viewer/fonts/{name}",
              new { controller = "GroupdocsViewer", action = "GetFont" }
              );

            routes.MapRoute(
              null,
              "document-viewer/images/{name}",
              new { controller = "GroupdocsViewer", action = "GetEmbeddedImage" }
              );

            routes.MapRoute(
               null,
               "document-viewer/CSS/GetCss",
               new { controller = "GroupdocsViewer", action = "GetCss" }
               );

            routes.MapRoute(
               null,
               "document-viewer/GetPdfWithPrintDialog",
               new { controller = "GroupdocsViewer", action = "GetPdfWithPrintDialog" }
               );

            routes.MapRoute(
               null,
               "document-viewer/{action}",
               new { controller = "GroupdocsViewer" }
               );
        }

        public static void InitDependencyInjection()
        {
            IContainer container = IoC.Initialize();
            DependencyResolver.SetResolver(new SmDependencyResolver(container));
        }
    }
}
