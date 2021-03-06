﻿using System;
using System.Collections.Specialized;
using System.Net;
using System.Web;
using Groupdocs.Web.UI;
using Groupdocs.Web.UI.DataTransferObjects;

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
                GetResourceForHtmlParameters parameters = new GetResourceForHtmlParameters();
                NameValueCollection requestParameters = context.Request.Params;
                parameters.DocumentPath = base.GetParameter<string>(requestParameters, "documentPath", null);
                parameters.ResourcePath = base.GetParameter<string>(requestParameters, "resourcePath", null);
                parameters.RelativeToOriginal = base.GetParameter<bool>(requestParameters, "relativeToOriginal", false);
                parameters.InstanceIdToken = base.GetParameter<string>(requestParameters, Constants.InstanceIdRequestKey, null);

                string detailsMessage = String.Format("GetResourceForHtml\r\nRoot Storage Path:{0}\r\n" +
                                                      "Processing Folder Path:{1}\r\n" +
                                                      "Document Path:{2}\r\n" +
                                                      "Resource Path:{3}\r\n",
                                                      _rootPathFinder.GetRootStoragePath(),
                                                      _rootPathFinder.GetCachePath(),
                                                      parameters.DocumentPath, parameters.ResourcePath);
                _logger.LogMessage(detailsMessage);

                DateTime? clientModifiedSince = GetClientModifiedSince(context);
                bool isModified;
                DateTime? fileModificationDateTime;

                byte[] resourceBytes = GetResourceForHtml(parameters, clientModifiedSince, out isModified, out fileModificationDateTime);
                string mimeType = _helper.GetImageMimeTypeFromFilename(parameters.ResourcePath);
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
