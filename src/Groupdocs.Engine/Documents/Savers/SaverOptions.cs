using System;
using Groupdocs.Storage;

namespace Groupdocs.Engine.Documents.Savers
{
    public class SaverOptions
    {
        /// <summary>
        /// A page number to save or leave it null if all document should be saved 
        /// </summary>
        public PagesRange[] PagesRanges;

        /// <summary>
        /// If set - a page will be scaled/fitted to a given width
        /// </summary>
        public int? Width { get; set; }

        /// <summary>
        /// If set - a page will be scaled/fitted to a given height
        /// </summary>
        public int? Height { get; set; }

        public int? Dpi { get; set; }
        /// <summary>
        /// Image quality in range from 1 to 100
        /// </summary>
        public int? Quality { get; set; }

        /// <summary>
        /// If true - a document will be fitted, otherwise just rescaled
        /// </summary>
        public bool KeepAspectRatio { get; set; }

        public bool Crop { get; set; }

        public bool UseAsposePdfToXml { get; set; }
        public bool PageInfoOnly { get; set; }
        
        public string SupposedOutPathForStream { get; set; }
        public bool UseFlowMode { get; set; }

        public IFileStorage OutputStorage { get; set; }

        #region html options
        public string ResourcePrefix { get; set; }
        public bool UsePngImages { get; set; }
        public bool GenerateLocallyViewableHtml { get; set; }
        public bool GenerateSingleHtmlFile { get; set; }
        public bool ShowPageBorderInHtml { get; set; }
        public bool SupportListOfContentControls { get; set; }
        public bool SupportListOfBookmarks { get; set; }
        public bool EmbedImagesIntoHtmlForWordFiles { get; set; }
        public string WholeFileLockName { get; set; }
        public string PageLockNameTemplate { get; set; }

        #endregion
    }
}