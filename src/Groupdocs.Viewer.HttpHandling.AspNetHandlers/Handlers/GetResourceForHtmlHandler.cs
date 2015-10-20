using System;
using System.Net;
using System.Web;
using Groupdocs.Web.UI;
using Groupdocs.Web.UI.ViewModels;

namespace Groupdocs.Viewer.HttpHandling.AspNetHandlers.Handlers
{
    public class GetResourceForHtmlHandler : BaseAspNetHandler
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
                GetResourceForHtmlViewModel viewModel = new GetResourceForHtmlViewModel();
                var parameters = context.Request.Params;
                viewModel.DocumentPath = base.GetParameter<string>(parameters, "documentPath", null);
                viewModel.ResourcePath = base.GetParameter<string>(parameters, "resourcePath", null);
                viewModel.RelativeToOriginal = base.GetParameter<bool>(parameters, "relativeToOriginal", false);
                viewModel.InstanceIdToken = base.GetParameter<string>(parameters, Constants.InstanceIdRequestKey, null);

                string detailsMessage = String.Format("GetResourceForHtml\r\nRoot Storage Path:{0}\r\n" +
                                                      "Processing Folder Path:{1}\r\n" +
                                                      "Document Path:{2}\r\n" +
                                                      "Resource Path:{3}\r\n",
                                                      _rootPathFinder.GetRootStoragePath(),
                                                      _rootPathFinder.GetCachePath(),
                                                      viewModel.DocumentPath, viewModel.ResourcePath);
                _logger.LogMessage(detailsMessage);

                DateTime? clientModifiedSince = GetClientModifiedSince(context);
                bool isModified;
                DateTime? fileModificationDateTime;

                byte[] resourceBytes = GetResourceForHtml(viewModel, clientModifiedSince, out isModified, out fileModificationDateTime);
                string mimeType = _helper.GetImageMimeTypeFromFilename(viewModel.ResourcePath);
                context.Response.ContentType = mimeType;
                if (context.Request.RequestType == "HEAD") // IE SVG
                    context.Response.AddHeader("Content-Length", resourceBytes.Length.ToString());
                else
                {
                    if (!isModified)
                    {
                        context.Response.StatusCode = (int) HttpStatusCode.NotModified;
                        return;
                    }

                    SetLastModified(context, fileModificationDateTime);

                    if (resourceBytes == null)
                        context.Response.StatusCode = (int)HttpStatusCode.Gone;
                    else
                        context.Response.BinaryWrite(resourceBytes);
                }
            }
            catch (Exception exception)
            {
                OnException(exception, context);
            }
        }

        #endregion
    }
}
