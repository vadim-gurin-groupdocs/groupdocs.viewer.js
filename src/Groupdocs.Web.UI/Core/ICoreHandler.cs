using System;
using Groupdocs.Web.Helpers.JSON;

namespace Groupdocs.Web.UI.Core
{
    public interface ICoreHandler
    {
        object ViewDocument(IUrlsCreator urlsCreator, IPrintableHtmlCreator printableHtmlCreator,
            string path, bool useHtmlBasedEngine = false, bool usePngImagesForHtmlBasedEngine = false,
            int? count = null, int? width = null,
            int? quality = null, bool usePdf = true,
            int? preloadPagesCount = null, bool convertWordDocumentsCompletely = false,
            string fileDisplayName = null,
            string watermarkText = null, int? watermarkColor = null,
            WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal, float watermarkWidth = 0,
            bool ignoreDocumentAbsence = false,
            bool supportPageRotation = false,
            bool supportListOfContentControls = false,
            bool supportListOfBookmarks = false,
            bool embedImagesIntoHtmlForWordFiles = false,
            string callback = null,
            string instanceId = null,
            string locale = null);

        FileBrowserTreeDataJS LoadFileBrowserTreeData(string path, int pageIndex = 0, int pageSize = -1, string orderBy = null, bool orderAsc = true, string filter = null, string fileTypes = null, bool extended = false, string callback = null, string instanceId = null);

        object GetImageUrls(IUrlsCreator urlsCreator,
            string path, string dimension, int firstPage = 0, int pageCount = 0,
            int? quality = null, bool usePdf = true,
            string watermarkText = null, int? watermarkColor = null,
            WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal, float watermarkWidth = 0,
            bool ignoreDocumentAbsence = false,
            bool useHtmlBasedEngine = false,
            bool supportPageRotation = false,
            string callback = null,
            string instanceId = null,
            string locale = null);

        byte[] GetDocumentPageImage(string path, int pageIndex, int? width, int? quality, bool usePdf = true,
            string watermarkText = null, int? watermarkColor = null,
            WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal,
            float watermarkFontSize = 0,
            bool ignoreDocumentAbsence = false,
            bool useHtmlBasedEngine = false,
            bool rotate = false,
            string instanceId = null, string locale = null);

        void GetDocumentPageHtml(IUrlsCreator urlsCreator,
            string path, int pageIndex, bool usePngImages,
            bool embedImagesIntoHtmlForWordFiles,
            out string pageHtml, out string pageCss, string instanceId = null, string locale = null);

        byte[] GetResourceForHtml(string documentPath, string resourcePath,
            DateTime? clientModifiedSince, out bool isModified, out DateTime? fileModificationDateTime,
            bool relativeToOriginal = false, string instanceId = null);

        string GetScript(string name);
        string GetCss(string name);
        void GetEmbeddedImage(string name, out byte[] bytes, out string mimeType);

        void GetFont(string name, out byte[] bytes, out string mimeType);

        bool GetFile(string path, bool getPdf, bool isPrintable,
            out byte[] bytes, out string fileDisplayName,
            string displayName = null,
            string watermarkText = null, int? watermarkColor = null,
            WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal,
            float watermarkFontSize = 0,
            bool ignoreDocumentAbsence = false,
            bool useHtmlBasedEngine = false,
            bool supportPageRotation = false,
            string instanceId = null);

        string[] GetPrintableHtml(IImageUrlCreator imageUrlCreator,
            string path, bool useHtmlBasedEngine = false,
            string displayName = null,
            string watermarkText = null, int? watermarkColor = null,
            WatermarkPosition? watermarkPosition = WatermarkPosition.Diagonal,
            float watermarkWidth = 0,
            bool ignoreDocumentAbsence = false,
            string instanceId = null,
            string locale = null);

        void ReorderPage(string path, int oldPosition, int newPosition, string callback = null, string instanceId = null);
        int RotatePage(string path, int pageNumber, int rotationAmount, string callback = null, string instanceId = null);

        string[] GetPageImageUrlsOnThirdPartyStorage(string path, int pageCount, int? quality, int? width,
            int? height, bool usePdf);
    }
}