using System;
using System.Web;

namespace Groupdocs.Viewer.HttpHandling.AspNetHandlers.Handlers
{
    public class CrossOriginHandler : BaseAspNetHandler
    {
        /// <summary>
        /// You will need to configure this handler in the web.config file of your 
        /// web and register it with IIS before being able to use it. For more information
        /// see the following link: http://go.microsoft.com/?linkid=8101007
        /// </summary>
        #region IHttpHandler Members

        public override bool IsReusable
        {
            // Return false in case your Managed Handler cannot be reused for another request.
            // Usually this would be false in case you have some state information preserved per request.
            get { return true; }
        }

        public override void ProcessRequest(HttpContext context)
        {
            try
            {
                //Clear the response (just in case)
                ClearResponse(context);

                //Checking the method
                switch (context.Request.HttpMethod.ToUpper())
                {
                        //Cross-Origin preflight request
                    case "OPTIONS":
                        //Set allowed method and headers
                        SetAllowCrossSiteRequestHeaders(context);
                        //Set allowed origin
                        //This happens for us with our module:
                        SetAllowCrossSiteRequestOrigin(context);
                        //End
                        context.Response.End();
                        break;

                    default:
                        context.Response.Headers.Add("Allow", "OPTIONS");
                        context.Response.StatusCode = 405;
                        break;
                }

                context.ApplicationInstance.CompleteRequest();
            }
            catch (Exception exception)
            {
                OnException(exception, context);
            }
        }

        #endregion


        #region Methods
        protected void ClearResponse(HttpContext context)
        {
            context.Response.ClearHeaders();
            context.Response.ClearContent();
            context.Response.Clear();
        }

        protected void SetNoCacheHeaders(HttpContext context)
        {
            context.Response.Cache.SetExpires(DateTime.UtcNow.AddDays(-1));
            context.Response.Cache.SetValidUntilExpires(false);
            context.Response.Cache.SetRevalidation(HttpCacheRevalidation.AllCaches);
            context.Response.Cache.SetCacheability(HttpCacheability.NoCache);
            context.Response.Cache.SetNoStore();
        }
        #endregion

        public static void SetAllowCrossSiteRequestHeaders(HttpContext context)
        {
            string requestMethod = context.Request.Headers["Access-Control-Request-Method"];

            context.Response.AppendHeader("Access-Control-Allow-Methods", "GET,POST");
            context.Response.AppendHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
        }

        public static void SetAllowCrossSiteRequestOrigin(HttpContext context)
        {
            string origin = context.Request.Headers["Origin"];

            if (!String.IsNullOrWhiteSpace(origin))
                context.Response.AppendHeader("Access-Control-Allow-Origin", origin);
            else
                //This is necessary for Chrome/Safari actual request
                context.Response.AppendHeader("Access-Control-Allow-Origin", "*");
        }
    }
}
