using System;
using System.Collections;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Groupdocs.Engine.Documents;
using Groupdocs.Storage;
using Groupdocs.Threading;
using Groupdocs.Web.UI;

namespace Groupdocs.Engine.Viewing
{
    public interface IViewingService
    {
        int GeneratePageImages(string filePath, ViewingOptions options, string outputFolder = null);
        string GetImagesFolder(string filePath, int? quality = null, int? width = null, int? height = null, bool usePdf = false);
        string GetCachedImageFullPath(string documentPath, int pageIndex, bool usePdf, int? width = null,
                                      int? quality = null, int? height = null);
        byte[] GetCachedImage(string documentPath, int pageIndex, int? width = null,
                              int? quality = null, int? height = null, bool usePdf = false,
                              string watermarkText = null, int? watermarkColor = null,
                              WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal,
                              float watermarkWidth = 0,
                              bool useHtmlBasedEngine = false,
                              bool supportPageRotation = false);
        
        string GenerateJavaScriptDescription(string filePath,
            string databaseGuid,
            bool checkFileDateTime = true,
            bool descForHtmlBasedEngine = false,
            bool descForImageBasedEngineWithoutTextSelection = false,
            bool saveToCustomTempStorage = false,
            bool returnConttents = false,
            bool supportListOfContentControls = false,
            bool supportListOfBookmarks = false,
            ProgressDelegate progressCallback = null, IDocument openedDocument = null, int? quality = null);
        //DocumentMetaInfo GetExtendedDocumentDescription(string filePath, CancellationToken cancellationToken);
        IDocument GetPdf(Stream fileContents, string fileExtension, string pathToResultPdf);
        Stream MergePdfDocuments(ICollection<IDocument> documents);
        string GetPdfWithPrintDialog(string filePath);
        int GetPageCount(string filePath, bool keepDocumentOpen, bool storePdfToCache, bool isLicensed);
        string GetProcessingFolderFullPath();
        Size GetPageSize(string filePath, bool usePdf, int? width = null, int? quality = null);
        byte[] GetPdfFile(string filePath, int countOfPagesToLeave, bool isPrintable, string watermarkText = null, int? watermarkColor = null,
                                      WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal,
                                      float watermarkSizeInPercent = 0,
                                      bool ignoreDocumentAbsence = false,
                                      bool useHtmlBasedEngine = false,
                                      bool supportPageRotation = false,
                                      bool supportPageReordering = false);

        byte[] GetPdfVersionCacheEnabled(string filePath, int countOfPagesToLeave, 
            bool isPrintable,
            string watermarkText = null, int? watermarkColor = null,
            WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal, float watermarkSizeInPercent = 0,
            bool ignoreDocumentAbsence = false,
            bool useHtmlBasedEngine = false,
            bool supportPageRotation = false, bool supportPageReordering = false);

        void GeneratePdfVersionOfDocument(String filePath, bool isLicensed,
            string watermarkText = null, int? watermarkColor = null,
            WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal, float watermarkWidth = 0);

        Stream GenerateOnePageImageFromDocument(string filePath, int pageNumber, int? quality, bool isLicensed, bool storeToCache);
        IFileStorage GetStorage();
        IFileStorage GetCacheStorage();
        IFileStorage GetTempStorage();
        string GetCacheRootFolder();
        void CloseDocument();
    }

    
}
