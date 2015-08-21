using System;

namespace Groupdocs.Web.UI
{
    internal class StringProvider
    {
        public StringProvider(string productName)
        {
            ProductName = !String.IsNullOrWhiteSpace(productName) ? productName : AssemblyConstants.Product;
        }

        public StringProvider()
        {
            ProductName = AssemblyConstants.Product;
        }
        
        private string ProductName { get; set; }
    }
}
