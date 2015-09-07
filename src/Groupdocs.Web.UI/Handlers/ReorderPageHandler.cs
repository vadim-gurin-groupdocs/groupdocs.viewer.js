using Groupdocs.Web.UI;
using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Web;
using System.Web.Script.Serialization;

namespace Groupdocs.Viewer.UI.Handlers
{
    public class ReorderPageHandler : BaseAspNetHandler, IHttpHandler
    {
        /// <summary>
        /// You will need to configure this handler in the web.config file of your 
        /// web and register it with IIS before being able to use it. For more information
        /// see the following link: http://go.microsoft.com/?linkid=8101007
        /// </summary>

        public ReorderPageHandler()
        {
        }

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

                //string path = (string)context.Request.Params["path"];
                JavaScriptSerializer serializer = new JavaScriptSerializer();

                string path = null;
                int oldPosition, newPosition;
                string instanceId = null;
                string json;
                bool isJsonP = (context.Request.HttpMethod == "GET");

                if (isJsonP)
                    json = context.Request.Params["data"];
                else
                    json = new StreamReader(context.Request.InputStream).ReadToEnd();
                Dictionary<string, string> inputParameters = serializer.Deserialize<Dictionary<string, string>>(json);
                GetMandatoryParameter(inputParameters, "path", out path);
                GetMandatoryParameter(inputParameters, "oldPosition", out oldPosition);
                GetMandatoryParameter(inputParameters, "newPosition", out newPosition);
                GetParameter(inputParameters, Constants.InstanceIdRequestKey, ref instanceId);

                ReorderPage(path, oldPosition, newPosition, null, instanceId);
                var data = new {succes = true};

                context.Response.ContentType = "application/json";
                context.Response.ContentEncoding = Encoding.UTF8;
                string serializedData = serializer.Serialize(data);
                if (isJsonP)
                    context.Response.Write(String.Format("{0}({1})", context.Request.Params["callback"], serializedData));
                else
                    context.Response.Write(serializedData);
            }
            catch (Exception exception)
            {
                OnException(exception, context);
            }
        }

        #endregion
    }
}
