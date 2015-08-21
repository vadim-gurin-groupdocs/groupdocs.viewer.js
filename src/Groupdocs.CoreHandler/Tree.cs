using System.Collections.Generic;

namespace Groupdocs.Web.Helpers
{
    using Groupdocs.Web.Helpers.JSON;

	public class JsTreeNode
	{
		public decimal id { get; set; }
        public string guid { get; set; }
		public string path { get; set; }
		public string name { get; set; }
		public string type { get; set; }
        public string docType { get; set; }
        public string fileType { get; set; }
        public string ext { get; set; }
        public long size { get; set; }
        public string url { get; set; }
        public long time { get; set; }
        public long modifyTime { get; set; }
        public int version { get; set; }
        public int fileCount { get; set; }
        public int folderCount { get; set; }
        public bool isKnown { get; set; }
        public bool isShared { get; set; }
        public string thumbnail { get; set; }
        public string[] supportedTypes { get; set; }
        
        public List<JsTreeNode> nodes
		{
			get;set;
		}
    }
}
