using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;
using Groupdocs.Viewer.HttpHandling.Core.Core;
using Groupdocs.Viewer.HttpHandling.WebApi.Core;

namespace GroupdocsViewer.EngineeringSample.Net4_5_1
{
    public class WebApiApplication : System.Web.HttpApplication
    {
        protected void Application_Start()
        {
            AreaRegistration.RegisterAllAreas();
            GlobalConfiguration.Configure(WebApiConfig.Register);
            FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);

            RouteConfig.RegisterRoutes(RouteTable.Routes);
            BundleConfig.RegisterBundles(BundleTable.Bundles);

            Viewer.SetBaseUrl("/");
            string rootStoragePath = @"d:\temp\";
            Viewer.SetRootStoragePath(rootStoragePath);
            Viewer.SetLicensePath(@"d:\temp\TestLicensesWithNewKey\GroupDocs Viewer2015-05-29.lic");
        }
    }
}
