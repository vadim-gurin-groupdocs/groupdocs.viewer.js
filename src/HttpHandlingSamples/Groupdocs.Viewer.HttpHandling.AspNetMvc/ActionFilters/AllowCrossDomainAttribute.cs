using System;
using System.Web.Mvc;

namespace Groupdocs.Viewer.HttpHandling.AspNetMvc.ActionFilters
{
    public class AllowCrossDomain : ActionFilterAttribute
    {
        public const string AllDomains = "*";
        private readonly string[] _allowMethods;
        private string _allowOrigin;

        public AllowCrossDomain()
            : this(null, null)
        {
        }

        public AllowCrossDomain(string allowOrigin, params string[] allowMethods)
        {
            _allowMethods = allowMethods;
            _allowOrigin = allowOrigin;

            if (string.IsNullOrWhiteSpace(_allowOrigin))
            {
                _allowOrigin = AllDomains;
            }

            if (_allowMethods == null || _allowMethods.Length == 0)
            {
                _allowMethods = new[] {"GET,POST"};
            }
        }


        public override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            try
            {
                filterContext.HttpContext.Response.Headers.Add("Access-Control-Allow-Origin", _allowOrigin);
            }
            catch (PlatformNotSupportedException) // IIS integrated mode required
            {}

            if (filterContext.HttpContext.Request.HttpMethod == "OPTIONS")
            {
                filterContext.HttpContext.Response.Headers.Add("Access-Control-Allow-Methods",
                                                               string.Join(", ", _allowMethods));
                filterContext.HttpContext.Response.AppendHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
                //filterContext.HttpContext.Response.Headers.Add("Access-Control-Max-Age", "86400");
                filterContext.Result = new EmptyResult();
            }
            else
            {
                base.OnActionExecuting(filterContext);
            }
        }

    }
}