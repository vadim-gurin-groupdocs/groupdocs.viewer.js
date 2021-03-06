﻿using System;

namespace Groupdocs.Viewer.HttpHandling.Core.Core
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
