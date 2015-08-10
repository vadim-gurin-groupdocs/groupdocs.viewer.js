using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Groupdocs.Web.UI
{
    public interface IRootPathFinder
    {
        string GetRootStoragePath();
        string GetCachePath();
        string GetLogFilePath();
        string RootStoragePath { set; }
        string CachePath { set; }
        string LogFilePath { set; }
    }


    public class RootPathFinder : IRootPathFinder
    {
        private static string _rootStoragePath;
        private static string _cachePath;
        private static string _logFilePath;

        public string RootStoragePath
        {
            set { _rootStoragePath = value; }
        }

        public string CachePath
        {
            set { _cachePath = value; }
        }

        public string LogFilePath
        {
            set { _logFilePath = value; }
        }

        public string GetRootStoragePath()
        {
            string rootStoragePath = null;
            HttpContext context = HttpContext.Current;
            if (context == null) // WCF
            {
                rootStoragePath = _rootStoragePath;
            }
            else
            {
                HttpApplicationState application = context.Application;
                if (application != null)
                {
                    if (IsPerRequestSettingUsed())
                        rootStoragePath = (string) context.Items[Constants.GroupdocsRootStoragePath];
                    else
                        rootStoragePath = (string) application[Constants.GroupdocsRootStoragePath];
                }

                if (rootStoragePath == null)
                    rootStoragePath = String.Empty;
            }

            return rootStoragePath;
        }


        public string GetCachePath()
        {
            string workingDirectoryPath = null;
            HttpContext context = HttpContext.Current;
            if (context == null) // WCF
            {
                workingDirectoryPath = _cachePath;
            }
            else
            {
                HttpApplicationState application = context.Application;
                if (application != null)
                {
                    if (IsPerRequestSettingUsed())
                        workingDirectoryPath = (string) context.Items[Constants.GroupdocsCachePath];
                    else
                        workingDirectoryPath = (string) application[Constants.GroupdocsCachePath];
                }
            }

            return workingDirectoryPath;
        }

        
        public string GetLogFilePath()
        {
            string logFilePath = null;
            HttpContext context = HttpContext.Current;
            if (context == null) // WCF
            {
                logFilePath = _logFilePath;
            }
            else
            {
                HttpApplicationState application = context.Application;
                logFilePath = (application != null ? (string)application[Constants.GroupdocsLogFilePath] : String.Empty);
            }

            return logFilePath;
        }

        private bool IsPerRequestSettingUsed()
        {
            bool storePerRequest = false;
            HttpContext context = HttpContext.Current;
            if (context != null)
            {
                HttpApplicationState application = context.Application;
                if (application != null)
                {
                    object objStorePerRequest = application[Constants.SetPerRequest];
                    if (objStorePerRequest != null)
                        storePerRequest = (bool)objStorePerRequest;
                }
            }
            return storePerRequest;
        }
    }
}
