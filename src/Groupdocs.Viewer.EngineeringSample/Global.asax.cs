
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;
using Groupdocs.Viewer.HttpHandling.AspNetHandlers.Core;
using Groupdocs.Viewer.HttpHandling.AspNetMvc.Controllers;
using Groupdocs.Viewer.HttpHandling.AspNetMvc.Core;
using Groupdocs.Viewer.HttpHandling.Core.Core;
using Groupdocs.Viewer.UI;

namespace GroupdocsViewer.EngineeringSample
{
    // Note: For instructions on enabling IIS6 or IIS7 classic mode, 
    // visit http://go.microsoft.com/?LinkId=9394801

    public class MvcApplication : System.Web.HttpApplication
    {
        public static void RegisterGlobalFilters(GlobalFilterCollection filters)
        {
            filters.Add(new HandleErrorAttribute());
        }

        public static void RegisterRoutes(RouteCollection routes)
        {
            routes.IgnoreRoute("{resource}.axd/{*pathInfo}");

            routes.MapRoute(
                "Default", // Route name
                "{controller}/{action}/{id}", // URL with parameters
                new { controller = "Home", action = "Index", id = UrlParameter.Optional } // Parameter defaults
            );

        }

        protected void Application_Start()
        {
            AreaRegistration.RegisterAllAreas();
            ViewerMvc.InitRoutes();
            Viewer.SetBaseUrl("/");

            Viewer.SetLicensePath(@"d:\temp\TestLicensesWithNewKey\GroupDocs Viewer2015-05-29.lic");
            string rootStoragePath = @"d:\temp\";
            Viewer.SetRootStoragePath(rootStoragePath);

            //ViewerAspNet.InitAspNetRoutes(); // must be after SetRootStoragePath() because handlers are created immediately

            RegisterGlobalFilters(GlobalFilters.Filters);
            RegisterRoutes(RouteTable.Routes);
            ControllerBuilder.Current.SetControllerFactory(new ViewerSelectiveControlerFactory());
        }
    }

    public class ViewerSelectiveControlerFactory : DefaultControllerFactory
    {
        protected override Type GetControllerType(RequestContext requestContext, string controllerName)
        {
            if (controllerName == "GroupdocsViewer")
                return typeof (GroupdocsViewerController);
            return base.GetControllerType(requestContext, controllerName);
        }
    }
}