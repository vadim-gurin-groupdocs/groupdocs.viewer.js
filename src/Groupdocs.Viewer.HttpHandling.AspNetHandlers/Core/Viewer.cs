using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Web;
using System.Web.Routing;
using Groupdocs.Viewer.UI.Handlers;

namespace Groupdocs.Viewer.UI
{
    /// <summary>
    /// Viewer global settings
    /// </summary>
    public static class ViewerAspNet
    {
        /// <summary>
        /// Initializes the ASP.NET handlers routes used by Viewer.
        /// Requires setup: https://msdn.microsoft.com/en-us/library/cc668202%28v=VS.90%29.aspx
        /// </summary>
        public static void InitAspNetRoutes()
        {
            RouteCollection routes = RouteTable.Routes;
            if (routes == null)
            {
                throw new InvalidOperationException("Cannot obtain 'RouteTable.Routes' collection");
            }

            routes.Add(null, new Route("document-viewer/ViewDocumentHandler",
               new ViewDocumentHandler()
            ));

            routes.Add(null, new Route("document-viewer/GetDocumentPageImageHandler",
               new GetDocumentPageImageHandler()
            ));

            routes.Add(null, new Route("document-viewer/LoadFileBrowserTreeDataHandler",
               new LoadFileBrowserTreeDataHandler()
            ));

            routes.Add(null, new Route("document-viewer/GetImageUrlsHandler",
               new GetImageUrlsHandler()
            ));

            routes.Add(null, new Route("document-viewer/GetFileHandler",
               new GetFileHandler()
            ));

            routes.Add(null, new Route("document-viewer/GetPdfWithPrintDialogHandler",
               new GetPdfWithPrintDialogHandler()
            ));

            routes.Add(null, new Route("document-viewer/GetPrintableHtmlHandler",
               new GetPrintableHtmlHandler()
            ));

            routes.Add(null, new Route("document-viewer/GetResourceForHtmlHandler",
               new GetResourceForHtmlHandler()
            ));

            routes.Add(null, new Route("document-viewer/GetDocumentPageHtmlHandler",
               new GetDocumentPageHtmlHandler()
            ));

            routes.Add(null, new Route("document-viewer/ReorderPageHandler",
               new ReorderPageHandler()
            ));

            routes.Add(null, new Route("document-viewer/RotatePageHandler",
               new RotatePageHandler()
            ));
        }
    }
}
