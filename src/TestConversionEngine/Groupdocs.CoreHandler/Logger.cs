using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using Groupdocs.Threading;

namespace Groupdocs.Web.UI
{
    public interface ILogger
    {
        void LogException(Exception exception);
        void LogMessage(string message);
    }

    public class Logger : ILogger
    {
        private string _logFilePath;
        public Logger(string logFilePath)
        {
            _logFilePath = logFilePath;
        }

        public void LogException(Exception exception)
        {
            if (_logFilePath == null)
                return;
            
            string record = exception.ToString();
            while (exception.InnerException != null)
            {
                record += "\r\n\tInner Exception:" + exception;
                exception = exception.InnerException;
            }

            using (new InterProcessLock(_logFilePath))
            {
                File.AppendAllText(_logFilePath,
                    String.Format("Local time:{0}, UTC time:{1} {2}\r\n\r\n", 
                                  DateTime.Now.ToString(CultureInfo.InvariantCulture), DateTime.UtcNow.ToString(CultureInfo.InvariantCulture), record));
            }
        }

        public void LogMessage(string message)
        {
            if (_logFilePath == null)
                return;

            using (new InterProcessLock(_logFilePath))
            {
                File.AppendAllText(_logFilePath,
                    String.Format("Local time:{0}, UTC time:{1} {2}\r\n",
                                  DateTime.Now.ToString(CultureInfo.InvariantCulture), DateTime.UtcNow.ToString(CultureInfo.InvariantCulture), message));
            }
        }
    }
}
