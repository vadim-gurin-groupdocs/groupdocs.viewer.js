using System;
using System.Collections.Generic;
using System.IO;
using System.Web;
using System.Web.Script.Serialization;
using Groupdocs.Viewer.HttpHandling.WebApi.ViewModels;
using Groupdocs.Web.UI;

namespace Groupdocs.Viewer.HttpHandling.AspNetHandlers.Handlers
{
    /// <summary>
    /// Returns information about all files and folders, which can be opened via "Document Browser" button on toolbar, in a form of JSON
    /// </summary>
    public class LoadFileBrowserTreeDataHandler : BaseAspNetHandler
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
                if (!_helper.IsRequestHandlingEnabled(Constants.GroupdocsFileListRequestHandlingIsEnabled))
                    return;

                JavaScriptSerializer serializer = new JavaScriptSerializer();
                string json;
                bool isJsonP = context.Request.HttpMethod == "GET";

                if (isJsonP)
                    json = context.Request.Params["data"];
                else
                    json = new StreamReader(context.Request.InputStream).ReadToEnd();
                
                LoadFileBrowserTreeDataViewModel viewModel = serializer.Deserialize<LoadFileBrowserTreeDataViewModel>(json);
                object data = LoadFileBrowserTreeData(viewModel);
                if (data == null)
                    return;

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
