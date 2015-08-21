using System;

namespace Groupdocs.Engine.Viewing
{
    public interface IHtmlViewingService : IViewingService
    {
        int GenerateHtml(string filePath, Func<string, string> htmlWithImageCreator,
            string prefixForResourceUrlsInHtml,
            string prefixForResourceUrlsInHtmlFiles,
            int? firstPage, int? pageCount,
            bool generatePagesToEndOfDocument,
            bool usePngImagesForHtmlBasedEngine,
            bool convertWordDocumentsCompletely,
            bool ignoreDocumentAbsence,
            bool saveToCustomTempStorage,
            bool supportListOfContentControls,
            bool supportListOfBookmarks,
            bool embedImagesIntoHtmlForWordFiles);
        void GetPagesHtml(string filePath, int startPageIndex, int pageCount, out string[] pageHtml, out string[] pageCss);
        byte[] GetResourceForHtml(string documentPath,
                                  string imagePath,
                                  DateTime? clientModifiedSince,
                                  out bool isModified,
                                  out DateTime? fileModificationDateTime,
                                  bool relativeToOriginal);
        string GetPagesSharedCss(string filePath);
    }
}
