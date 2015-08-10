using System;
using System.Linq;
using System.Web;
using Groupdocs.Web.UI.Handlers;

namespace Groupdocs.Web.UI.HttpModules
{
    public class AllowCrossOriginModule : IHttpModule
    {
        private static string[] _urlExcludeKeywords = new[] { "signalr" };

        public String ModuleName
        {
            get { return "AllowCrossOriginModule"; }
        }

        public void Init(HttpApplication application)
        {
            application.BeginRequest += (new EventHandler(this.Application_BeginRequest));
        }

        private void Application_BeginRequest(Object source, EventArgs e)
        {
            HttpApplication application = (HttpApplication)source;
            HttpContext context = application.Context;

            if (context.Request.HttpMethod.ToUpper() != "OPTIONS" &&
                !_urlExcludeKeywords.Any(x => context.Request.Url.AbsoluteUri.Contains(x)))
            {
                CrossOriginHandler.SetAllowCrossSiteRequestOrigin(context);
            }
        }

        public void Dispose()
        {
        }
    }
}
