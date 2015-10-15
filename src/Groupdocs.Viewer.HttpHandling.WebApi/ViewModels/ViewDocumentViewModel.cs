﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Groupdocs.Web.UI;

namespace Groupdocs.Viewer.HttpHandling.WebApi.ViewModels
{
    public class ViewDocumentViewModel
    {
        public string path { get; set; }
        public bool useHtmlBasedEngine { get; set; }
        public bool usePngImagesForHtmlBasedEngine { get; set; }
        public int? count { get; set; }
        public int? width { get; set; }
        public int? quality { get; set; }
        public bool usePdf { get; set; }
        public int? preloadPagesCount { get; set; }
        public bool convertWordDocumentsCompletely { get; set; }
        public string fileDisplayName { get; set; }
        public string watermarkText { get; set; }
        public int? watermarkColor { get; set; }
        public WatermarkPosition watermarkPosition { get; set; }
        public float watermarkWidth { get; set; }
        public bool ignoreDocumentAbsence { get; set; }
        public bool supportPageRotation { get; set; }
        public bool supportListOfContentControls { get; set; }
        public bool supportListOfBookmarks { get; set; }
        public bool embedImagesIntoHtmlForWordFiles { get; set; }
        public string instanceIdToken { get; set; }
        public string locale { get; set; }
        public string callback { get; set; }
    }
}
