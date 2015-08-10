using System;

namespace Groupdocs.Engine.Viewing
{
    public struct ViewingOptions : ICloneable
    {
        public int? FirstPage { get; set; }
        public int? PageCount { get; set; }
        public int? Width { get; set; }
        public int? Height { get; set; }
        public int? Quality { get; set; }
        public bool KeepAspectRatio { get; set; }
        public bool UsePdf { get; set; }
        public bool SplitPdf { get; set; }
        public bool CheckFileDateTime { get; set; }
        public bool DeleteFullSizeImages { get; set; }
        public bool IgnoreDocumentAbsence { get; set; }
        public bool SaveToCustomTempStorage { get; set; }
        public bool UseHtmlBasedEngine { get; set; }
        public bool SupportListOfContentControls { get; set; }
        public bool SupportListOfBookmarks { get; set; }
        
        public ProgressDelegate ProgressCallback { get; set; }

        public int? LastPage
        {
            get { return (PageCount != null ? new int?((FirstPage ?? 0) + PageCount.Value - 1) : null); }
        }

        public object Clone()
        {
            return new ViewingOptions
            {
                FirstPage = this.FirstPage,
                PageCount = this.PageCount,
                Width = this.Width,
                Height = this.Height,
                Quality = this.Quality,
                KeepAspectRatio = this.KeepAspectRatio,
                UsePdf = this.UsePdf,
                SplitPdf = this.SplitPdf,
                CheckFileDateTime = this.CheckFileDateTime,
                DeleteFullSizeImages = this.DeleteFullSizeImages,
                IgnoreDocumentAbsence = this.IgnoreDocumentAbsence,
                SaveToCustomTempStorage = this.SaveToCustomTempStorage,
                SupportListOfContentControls = this.SupportListOfContentControls,
                SupportListOfBookmarks = this.SupportListOfBookmarks
            };
        }
    }
}
