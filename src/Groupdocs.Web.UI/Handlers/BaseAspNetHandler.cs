using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text;
using System.Web;
using System.Web.Script.Serialization;
using Groupdocs.Web.UI.Core;
using Groupdocs.Common.InstallableViewer;
using System.Web.Routing;

namespace Groupdocs.Viewer.UI.Handlers
{
    public abstract class BaseAspNetHandler: CoreHandler, IHttpHandler, IRouteHandler
    {
        #region IHttpHandler
        public abstract bool IsReusable
        {
            get;
        }

        public abstract void ProcessRequest(HttpContext context);
        #endregion

        public BaseAspNetHandler(string productName = null) :
            base(productName)
        {
        }

        protected void OnException(Exception exception, HttpContext context)
        {
            string pathsMessage = String.Format("Exception\r\nRoot Storage Path:{0}\r\nProcessing Path:{1}",
            _rootPathFinder.GetRootStoragePath(), _rootPathFinder.GetCachePath());
            _logger.LogMessage(pathsMessage);
            _logger.LogException(exception);

            if (_helper.AreExceptionDetailsShownOnClient())
                throw exception;
            else
            {
                bool isJsonP = context.Request.HttpMethod == "GET";

                JavaScriptSerializer serializer = new JavaScriptSerializer()
                {
                    MaxJsonLength = CommonConstants.MaxJsonLength
                };

                var errorData = new { success = false, Reason = exception.Message };
                string serializedErrorData = serializer.Serialize(errorData);
                context.Response.ContentType = "application/json";
                if (isJsonP)
                    context.Response.Write(String.Format("{0}({1})", context.Request.Params["callback"],
                                                         serializedErrorData));
                else
                    context.Response.Write(serializedErrorData);
            }
        }
        
        protected void CreateJsonOrJsonpResponse(HttpContext context, string serializedData)
        {
            bool isJsonP = (context.Request.HttpMethod == "GET");
            context.Response.ContentType = "application/json";
            context.Response.ContentEncoding = Encoding.UTF8;
            if (isJsonP)
                context.Response.Write(String.Format("{0}({1})", context.Request.Params["callback"], serializedData));
            else
                context.Response.Write(serializedData);
        }

        
        protected int? ExtractIntParameter(HttpContext context, string name)
        {
            int? returnValue = null;
            string stringValue = context.Request.Params[name];
            if (!String.IsNullOrEmpty(stringValue))
                returnValue = Int32.Parse(stringValue);
            return returnValue;
        }

        protected void GetMandatoryParameter<T>(Dictionary<string, string> inputParameters,
                                                string name,
                                                out T result)
        {
            result = default(T);
            GetParameter<T>(inputParameters, name, ref result, true);
        }

        protected void GetParameter<T>(Dictionary<string, string> inputParameters,
            string name,
            ref T result)
        {
            GetParameter<T>(inputParameters, name, ref result, false);
        }

        private void GetParameter<T>(Dictionary<string, string> inputParameters,
                                       string name,
                                       ref T result,
                                       bool isMandatory)
        {
            if (inputParameters.ContainsKey(name))
            {
                string parameterValueString = inputParameters[name];
                if (parameterValueString != null)
                {
                    Type resultType = typeof(T);
                    if (resultType.IsGenericType && resultType.GetGenericTypeDefinition() == typeof (Nullable<>))
                    {
                        Type underlyingResultType = Nullable.GetUnderlyingType(resultType);
                        resultType = underlyingResultType;
                    }

                    if (resultType.IsEnum)
                        result = (T)Enum.Parse(resultType, parameterValueString);
                    else
                        result = (T)Convert.ChangeType(parameterValueString, resultType, CultureInfo.InvariantCulture);
                }
            }
            else if (isMandatory)
            {
                throw new ArgumentException("A mandatory argument is missing", name);
            }
        }

        protected DateTime? GetClientModifiedSince(HttpContext context)
        {
            string stringClientModifiedSince = context.Request.Headers["If-Modified-Since"];
            DateTime? clientModifiedSince = _helper.GetDateTimeFromClientHeader(stringClientModifiedSince);
            return clientModifiedSince;
        }

        protected void SetLastModified(HttpContext context, DateTime? fileModificationDateTime)
        {
            if (fileModificationDateTime.HasValue)
            {
                DateTime now = DateTime.Now;
                if (fileModificationDateTime > now)
                    fileModificationDateTime = now;
                context.Response.Cache.SetLastModified((DateTime)fileModificationDateTime);
            }
        }

        public IHttpHandler GetHttpHandler(RequestContext requestContext)
        {
            return this;
        }
    }
}
