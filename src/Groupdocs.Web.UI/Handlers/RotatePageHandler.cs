using System;
using System.Collections.Generic;
using System.IO;
using System.Web;
using System.Web.Script.Serialization;

namespace Groupdocs.Web.UI.Handlers
{
    public class RotatePageHandler : CoreHandler, IHttpHandler
    {
        /// <summary>
        /// You will need to configure this handler in the web.config file of your 
        /// web and register it with IIS before being able to use it. For more information
        /// see the following link: http://go.microsoft.com/?linkid=8101007
        /// </summary>

        #region IHttpHandler Members

        public bool IsReusable
        {
            // Return false in case your Managed Handler cannot be reused for another request.
            // Usually this would be false in case you have some state information preserved per request.
            get { return true; }
        }

        public void ProcessRequest(HttpContext context)
        {
            try
            {
                if (!_helper.IsRequestHandlingEnabled(Constants.GroupdocsReorderPageRequestHandlingIsEnabled))
                    return;

                JavaScriptSerializer serializer = new JavaScriptSerializer();

                string path;
                int pageNumber, rotationAmount;
                string instanceId = null;
                string json;
                bool isJsonP = (context.Request.HttpMethod == "GET");

                if (isJsonP)
                    json = context.Request.Params["data"];
                else
                    json = new StreamReader(context.Request.InputStream).ReadToEnd();
                Dictionary<string, string> inputParameters = serializer.Deserialize<Dictionary<string, string>>(json);
                path = inputParameters["path"];
                if (string.IsNullOrWhiteSpace(path))
                {
                    throw new ArgumentException("Document name is invalid");
                }
                GetMandatoryParameter(inputParameters, "pageNumber", out pageNumber);
                GetMandatoryParameter(inputParameters, "rotationAmount", out rotationAmount);
                GetParameter(inputParameters, Constants.InstanceIdRequestKey, ref instanceId);

                int resultAngle = RotatePage(path, pageNumber, rotationAmount, null, instanceId);
                var data = new {resultAngle, success = true};
                string serializedData = serializer.Serialize(data);

                CreateJsonOrJsonpResponse(context, serializedData);
            }
            catch (Exception exception)
            {
                OnException(exception, context);
            }
        }

        #endregion
    }
}
